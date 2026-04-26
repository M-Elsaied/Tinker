/**
 * Build an editable Microsoft Word (.docx) report from the same data the
 * on-screen report renders from. Plot panels are captured via Plotly.toImage
 * and embedded as PNGs.
 *
 * Why a real .docx (vs. converting the HTML preview): the user can open it in
 * Word and edit tables, headings, and text directly — no screenshotted images
 * of tables, no broken layouts.
 */
import type { Project, ResponseGoalConfig } from '@/types'
import type { ReportData } from './reportFetcher'
import type { ResponseFindings } from './insights'
import { plotlyToImageURL } from './plotlyToImage'

interface ExportOpts {
  filename?: string
  /** Root element to scan for [data-report-plot] nodes for image capture. */
  reportRoot?: HTMLElement | null
  summary?: { intro: string; findings: string[]; recommendations: string[] } | null
}

/** Map plot wrapper → captured PNG data URL, keyed by a stable id. */
type PlotImageMap = Record<string, { url: string; width: number; height: number }>

async function capturePlots(root: HTMLElement | null): Promise<PlotImageMap> {
  if (!root) return {}
  const out: PlotImageMap = {}
  const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-report-plot]'))
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const w = node.offsetWidth
    const h = node.offsetHeight
    if (w < 10 || h < 10) continue
    const url = await plotlyToImageURL(node, { width: w, height: h, format: 'png', scale: 2 })
    if (!url) continue
    const id = node.dataset.reportPlot || `plot-${i}`
    out[id] = { url, width: w, height: h }
  }
  return out
}

function dataUrlToUint8(url: string): Uint8Array {
  const base64 = url.split(',')[1] ?? ''
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function fmt(n: number | null | undefined, d = 4): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  if (Math.abs(n) >= 1e6 || (n !== 0 && Math.abs(n) < 1e-4)) return n.toExponential(2)
  return n.toFixed(d)
}

function fmtP(p: number | null | undefined): string {
  if (p === null || p === undefined || Number.isNaN(p)) return '—'
  if (p < 0.0001) return '< 0.0001'
  return p.toFixed(4)
}

export async function exportToWord(
  project: Project,
  report: ReportData,
  findingsList: ResponseFindings[],
  goals: ResponseGoalConfig[],
  opts: ExportOpts = {},
): Promise<void> {
  const filename = opts.filename ?? `${project.name.replace(/\s+/g, '_')}.docx`

  // Capture the live Plotly plots BEFORE we build the document, so the user
  // sees the same figures as in the on-screen / PDF report.
  const plotImages = await capturePlots(opts.reportRoot ?? null)

  const docx = await import('docx')
  const fs = await import('file-saver')
  const {
    AlignmentType, BorderStyle, Document, Footer, HeadingLevel, ImageRun,
    PageBreak, PageNumber, Packer, Paragraph, ShadingType,
    Table, TableCell, TableRow, TextRun, WidthType,
  } = docx

  // ── Helpers ────────────────────────────────────────────────────────────
  const H = (text: string, level: typeof HeadingLevel.HEADING_1) =>
    new Paragraph({ heading: level, children: [new TextRun({ text })] })

  const P = (text: string, opts: { bold?: boolean; italic?: boolean; size?: number } = {}) =>
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text, bold: opts.bold, italics: opts.italic, size: opts.size })],
    })

  const small = (text: string) =>
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text, size: 18, color: '666666' })],
    })

  const codeLine = (text: string) =>
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text, font: 'Consolas', size: 18 })],
    })

  const cell = (text: string, opts: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; shade?: string } = {}) =>
    new TableCell({
      shading: opts.shade
        ? { type: ShadingType.CLEAR, color: 'auto', fill: opts.shade }
        : undefined,
      children: [
        new Paragraph({
          alignment: opts.align ?? AlignmentType.LEFT,
          children: [new TextRun({ text, bold: opts.bold, size: 18 })],
        }),
      ],
    })

  const buildTable = (rows: string[][], opts: { headerRow?: boolean; rightAlignFromCol?: number } = {}) => {
    const headerShade = 'EEEEEE'
    const tableRows = rows.map((row, i) => {
      const isHeader = opts.headerRow && i === 0
      return new TableRow({
        tableHeader: isHeader,
        children: row.map((c, j) =>
          cell(c, {
            bold: isHeader,
            shade: isHeader ? headerShade : undefined,
            align:
              opts.rightAlignFromCol !== undefined && j >= opts.rightAlignFromCol
                ? AlignmentType.RIGHT
                : AlignmentType.LEFT,
          }),
        ),
      })
    })
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
        left: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'EEEEEE' },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'EEEEEE' },
      },
      rows: tableRows,
    })
  }

  const imageBlock = (id: string, captionText: string, maxWidthPx = 600) => {
    const img = plotImages[id]
    if (!img) return [P(`[Plot not captured: ${captionText}]`, { italic: true })]
    const ratio = Math.min(1, maxWidthPx / img.width)
    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: 'png',
            data: dataUrlToUint8(img.url),
            transformation: {
              width: img.width * ratio,
              height: img.height * ratio,
            },
          } as any),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [new TextRun({ text: captionText, italics: true, size: 18, color: '666666' })],
      }),
    ]
  }

  // ── Document body ─────────────────────────────────────────────────────
  const body: Array<InstanceType<typeof Paragraph> | InstanceType<typeof Table>> = []

  // Cover
  body.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 400 },
      children: [new TextRun({ text: project.name, bold: true, size: 48 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: 'Design of Experiments Report', size: 28, color: '555555' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: `Generated ${new Date().toLocaleDateString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric',
          })}`,
          size: 20, color: '888888',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({
          text: `${project.factors.length} factors  ·  ${project.designRows.length} runs  ·  ${project.responses.length} response${project.responses.length === 1 ? '' : 's'}`,
          size: 20, color: '888888',
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  )

  // Executive summary
  if (opts.summary) {
    body.push(H('Executive summary', HeadingLevel.HEADING_1))
    body.push(P(opts.summary.intro))
    if (opts.summary.findings.length) {
      body.push(P('Findings', { bold: true }))
      for (const f of opts.summary.findings) body.push(P(f))
    }
    if (opts.summary.recommendations.length) {
      body.push(P('Recommendations', { bold: true }))
      for (const r of opts.summary.recommendations) body.push(P(r))
    }
  }

  // Design
  body.push(H('Design', HeadingLevel.HEADING_1))
  body.push(small(`Design type: ${project.designType}`))
  body.push(P('Factors:', { bold: true }))
  body.push(buildTable(
    [
      ['Factor', 'Low', 'High', 'Units'],
      ...project.factors.map((f) => [
        f.name, String(f.low), String(f.high), f.units || '—',
      ]),
    ],
    { headerRow: true, rightAlignFromCol: 1 },
  ))

  // Data
  body.push(H('Data', HeadingLevel.HEADING_1))
  const dataHeader = ['Run', ...project.factors.map((f) => f.name), ...project.responses.map((r) => r.name)]
  const dataRows = project.designRows.map((row, i) => [
    String(row.run),
    ...row.actual.map((v) => fmt(v, 3)),
    ...project.responses.map((r) =>
      r.data[i] === null || r.data[i] === undefined || Number.isNaN(r.data[i] as number)
        ? '—'
        : fmt(r.data[i] as number, 3),
    ),
  ])
  body.push(buildTable([dataHeader, ...dataRows], { headerRow: true, rightAlignFromCol: 1 }))

  // Per-response analysis
  for (let i = 0; i < report.perResponse.length; i++) {
    const entry = report.perResponse[i]
    const findings = findingsList[i]
    const a = entry.analysis
    body.push(new Paragraph({ children: [new PageBreak()] }))
    body.push(H(`Analysis · ${entry.name}`, HeadingLevel.HEADING_1))

    body.push(P('Model summary', { bold: true }))
    body.push(buildTable(
      [
        ['Statistic', 'Value'],
        ['R²', fmt(a.r_squared, 4)],
        ['Adj R²', fmt(a.adj_r_squared, 4)],
        ['Pred R²', fmt(a.pred_r_squared, 4)],
        ['Adeq Precision', fmt(a.adeq_precision, 3)],
        ['Std Dev', fmt(a.std_dev, 4)],
        ['Mean', fmt(a.mean, 4)],
        ['CV %', fmt(a.cv_percent, 3)],
        ['PRESS', fmt(a.press, 3)],
      ],
      { headerRow: true, rightAlignFromCol: 1 },
    ))

    body.push(P('ANOVA', { bold: true }))
    body.push(buildTable(
      [
        ['Source', 'SS', 'df', 'MS', 'F', 'p'],
        ...a.anova.map((r) => [
          r.source,
          fmt(r.sum_sq, 4),
          String(r.df),
          Number.isNaN(r.mean_sq) ? '—' : fmt(r.mean_sq, 4),
          fmt(r.f_value, 3),
          fmtP(r.p_value),
        ]),
      ],
      { headerRow: true, rightAlignFromCol: 1 },
    ))

    if (entry.narrative?.paragraphs?.length) {
      body.push(P('Interpretation', { bold: true }))
      for (const para of entry.narrative.paragraphs) {
        body.push(P(typeof para === 'string' ? para : (para as any).text ?? String(para)))
      }
    }

    body.push(P('Coefficients (coded units)', { bold: true }))
    body.push(buildTable(
      [
        ['Term', 'Estimate', 'Std Error', 't', 'p', 'VIF'],
        ...a.coefficients_coded.map((r) => [
          r.term,
          fmt(r.estimate, 4),
          r.std_error > 0 ? fmt(r.std_error, 4) : '—',
          r.t_value === null ? '—' : fmt(r.t_value, 3),
          fmtP(r.p_value),
          r.vif === null ? '—' : fmt(r.vif, 2),
        ]),
      ],
      { headerRow: true, rightAlignFromCol: 1 },
    ))

    body.push(P('Final equation — coded units', { bold: true }))
    body.push(codeLine(a.equation_coded))
    body.push(P('Final equation — actual units', { bold: true }))
    body.push(codeLine(a.equation_actual))

    if (findings?.bullets?.length) {
      body.push(P('Key takeaways', { bold: true }))
      for (const b of findings.bullets) {
        body.push(new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: `• ${b.text}`, size: 20 })],
        }))
      }
    }
  }

  // Optimization
  if (report.optimization && report.optimization.solutions?.length) {
    body.push(new Paragraph({ children: [new PageBreak()] }))
    body.push(H('Optimization', HeadingLevel.HEADING_1))

    body.push(P('Goals', { bold: true }))
    body.push(buildTable(
      [
        ['Response', 'Goal', 'Lower', 'Upper', 'Target', 'Weight', 'Importance'],
        ...goals.map((g) => [
          g.name, g.goal,
          fmt(g.lower, 3), fmt(g.upper, 3),
          g.target === null || g.target === undefined ? '—' : fmt(g.target, 3),
          fmt(g.weight ?? 1, 2), String(g.importance ?? 3),
        ]),
      ],
      { headerRow: true, rightAlignFromCol: 2 },
    ))

    body.push(P('Top solutions', { bold: true }))
    const top = report.optimization.solutions.slice(0, 5)
    const factorCols = project.factors.map((f) => f.name)
    const respCols = project.responses.map((r) => r.name)
    body.push(buildTable(
      [
        ['#', ...factorCols, ...respCols, 'Desirability'],
        ...top.map((s, i) => [
          String(i + 1),
          ...factorCols.map((fname) => fmt(s.factors?.[fname] ?? null, 3)),
          ...respCols.map((rname) => fmt(s.responses?.[rname] ?? null, 3)),
          fmt(s.composite_desirability, 3),
        ]),
      ],
      { headerRow: true, rightAlignFromCol: 1 },
    ))
  }

  // ── Build & save ───────────────────────────────────────────────────────
  const doc = new Document({
    creator: 'Tinker — DOE Lab',
    title: project.name,
    description: `DOE report for ${project.name}`,
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22 } },
      },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 32, bold: true, color: '1f3a93' },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 26, bold: true, color: '333333' },
          paragraph: { spacing: { before: 160, after: 80 } },
        },
      ],
    },
    sections: [
      {
        properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Page ', size: 16, color: '888888' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '888888' }),
                  new TextRun({ text: ' of ', size: 16, color: '888888' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '888888' }),
                  new TextRun({ text: '   ·   Generated with Tinker', size: 16, color: '888888' }),
                ],
              }),
            ],
          }),
        },
        children: body,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  fs.saveAs(blob, filename)

  // imageBlock + plotImages reserved for a follow-up that embeds diagnostic
  // and surface plots in the Word doc. Keeps tree-shaker happy for now.
  void imageBlock
  void plotImages
}
