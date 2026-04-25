import { plotlyToImageURL } from './plotlyToImage'

interface ExportOpts {
  filename?: string
  /** Force a specific theme during export (default: 'light'). */
  forceTheme?: 'light' | 'dark' | 'preserve'
}

/** Convert every Plotly plot inside `root` into a static `<img>` snapshot.
 *  Returns a teardown that puts the originals back. */
async function snapshotPlots(root: HTMLElement): Promise<() => void> {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-report-plot]'))
  const restorers: Array<() => void> = []
  for (const wrapper of nodes) {
    const w = wrapper.offsetWidth
    const h = wrapper.offsetHeight
    if (w < 10 || h < 10) continue
    const url = await plotlyToImageURL(wrapper, { width: w, height: h, format: 'png', scale: 2 })
    if (!url) continue
    const original = wrapper.innerHTML
    const img = document.createElement('img')
    img.src = url
    img.style.width = `${w}px`
    img.style.height = `${h}px`
    img.style.display = 'block'
    img.style.maxWidth = '100%'
    wrapper.innerHTML = ''
    wrapper.appendChild(img)
    restorers.push(() => { wrapper.innerHTML = original })
  }
  return () => restorers.forEach((fn) => fn())
}

export async function exportToPdf(
  root: HTMLElement,
  opts: ExportOpts = {},
): Promise<void> {
  const filename = opts.filename ?? 'doe-lab-report.pdf'
  const html = document.documentElement
  const wasDark = html.classList.contains('dark')
  const force = opts.forceTheme ?? 'light'
  if (force === 'light' && wasDark) html.classList.remove('dark')
  if (force === 'dark' && !wasDark) html.classList.add('dark')
  html.dataset.report = 'exporting'
  // give layout / Plotly one frame to settle
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

  const restorePlots = await snapshotPlots(root)

  try {
    const html2pdfMod = (await import('html2pdf.js')) as any
    const html2pdf = html2pdfMod.default ?? html2pdfMod
    await html2pdf()
      .from(root)
      .set({
        margin: [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.96 },
        html2canvas: {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
          windowWidth: root.scrollWidth,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'avoid-all'], avoid: ['.report-no-break'] },
      })
      .save()
  } finally {
    restorePlots()
    html.dataset.report = ''
    if (force === 'light' && wasDark) html.classList.add('dark')
    if (force === 'dark' && !wasDark) html.classList.remove('dark')
  }
}
