import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, FileBarChart, Loader2, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RequireProject } from '@/components/layout/RequireProject'
import { useProjectStore } from '@/stores/projectStore'
import { fetchAllAnalyses, type ReportData } from '@/lib/reportFetcher'
import { executiveSummary, keyFindingsForResponse } from '@/lib/insights'
import { exportToPdf } from '@/lib/pdfExport'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { ReportShell } from '@/components/report/ReportShell'
import { CoverPage } from '@/components/report/CoverPage'
import { ExecutiveSummary } from '@/components/report/ExecutiveSummary'
import { DesignSection } from '@/components/report/DesignSection'
import { DataSection } from '@/components/report/DataSection'
import { AnalysisSection } from '@/components/report/AnalysisSection'
import { OptimizationSection } from '@/components/report/OptimizationSection'
import { NotesSection } from '@/components/report/NotesSection'
import { GlossaryAppendix } from '@/components/report/GlossaryAppendix'
import type { ResponseGoalConfig } from '@/types'
import { EXAMPLES } from '@/data/examples'

export function ReportPage() {
  return (
    <RequireProject illustration="chart" title="Open an experiment to generate its report">
      <ReportInner />
    </RequireProject>
  )
}

function ReportInner() {
  const project = useProjectStore((s) => s.project)!
  const navigate = useNavigate()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const shellRef = useRef<HTMLDivElement>(null)

  // Build default goals (override with example-supplied goals if available)
  const goals: ResponseGoalConfig[] = useMemo(() => {
    const exId = project.designInfo?.exampleId as string | undefined
    const ex = exId ? EXAMPLES.find((e) => e.id === exId) : undefined
    return project.responses.map((r) => {
      const filled = r.data.filter((v): v is number => v !== null && v !== undefined && !Number.isNaN(v))
      const lo = filled.length ? Math.min(...filled) : 0
      const hi = filled.length ? Math.max(...filled) : 1
      const exGoal = ex?.goals.find((g) => g.name === r.name)
      return {
        name: r.name,
        selected_terms: r.selectedTerms ?? [],
        goal: exGoal?.goal ?? 'maximize',
        lower: exGoal?.lower ?? lo,
        upper: exGoal?.upper ?? hi,
        target: exGoal?.target ?? null,
        weight: exGoal?.weight ?? 1,
        importance: exGoal?.importance ?? 3,
      }
    })
  }, [project])

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchAllAnalyses(project, { goalsByResponseIdx: Object.fromEntries(goals.map((g, i) => [i, g])) })
      .then((r) => setReport(r))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id])

  // Auto-trigger download if URL has ?download=1 (used by command palette)
  const downloadOnReady = typeof window !== 'undefined' && window.location.search.includes('download=1')
  useEffect(() => {
    if (!loading && report && downloadOnReady) {
      void handleDownload()
      // strip ?download from URL so refresh doesn't re-trigger
      window.history.replaceState({}, '', window.location.pathname)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, report])

  const handleDownload = async () => {
    if (!shellRef.current) return
    setExporting(true)
    const filename = `${project.name.replace(/\s+/g, '_')}.pdf`
    const promise = exportToPdf(shellRef.current, { filename })
    toast.promise(promise, {
      loading: 'Rendering PDF — this can take a few seconds…',
      success: `Saved ${filename}`,
      error: 'PDF export failed',
    })
    try { await promise } catch { /* toast already handled */ }
    setExporting(false)
  }

  const findingsList = useMemo(
    () => report?.perResponse.map((p) =>
      keyFindingsForResponse(p.name, p.analysis, p.diagnostics, p.boxCox),
    ) ?? [],
    [report],
  )

  const summary = useMemo(
    () => executiveSummary(project, findingsList, report?.optimization?.solutions[0]),
    [project, findingsList, report],
  )

  const sections: { id: string; label: string }[] = [
    { id: 'cover', label: 'Cover' },
    { id: 'executive', label: 'Executive summary' },
    { id: 'design', label: 'Design' },
    { id: 'data', label: 'Data' },
    ...findingsList.map((f) => ({
      id: `analysis-${f.responseName.replace(/\s+/g, '-').toLowerCase()}`,
      label: `Analysis · ${f.responseName}`,
    })),
    ...(report?.optimization ? [{ id: 'optimization', label: 'Optimization' }] : []),
    ...((project.designInfo?.notes as string | undefined) ? [{ id: 'notes', label: 'Notes' }] : []),
    { id: 'glossary', label: 'Glossary' },
  ]

  return (
    <div className="flex h-full flex-col min-h-0">
      {/* Toolbar */}
      <div
        data-report-hide
        className={cn(
          'flex items-center gap-2 border-b border-border-soft bg-card px-4 py-2 shrink-0 no-print',
        )}
      >
        <Button size="sm" variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>
        <div className="flex items-center gap-2 text-[12.5px]">
          <FileBarChart className="h-4 w-4 text-primary" />
          <span className="font-semibold">Report</span>
          <span className="text-muted-foreground">— {project.name}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={exporting || loading}>
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Download PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left section navigator */}
        <aside data-report-hide className="w-52 shrink-0 border-r border-border-soft bg-card p-3 overflow-auto scroll-thin no-print">
          <div className="text-eyebrow mb-2">Sections</div>
          <ul className="space-y-0.5">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className="block rounded px-2 py-1 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* Body */}
        <div className="flex-1 min-w-0 overflow-auto scroll-thin bg-muted/20">
          <div className="py-6 px-4">
            {loading && (
              <div className="grid place-items-center h-[60vh] text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <div className="text-sm">Compiling analyses…</div>
              </div>
            )}
            {error && (
              <div className="max-w-md mx-auto rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}
            {!loading && !error && report && (
              <ReportShell ref={shellRef}>
                <CoverPage project={project} />
                <ExecutiveSummary summary={summary} perResponse={findingsList} />
                <DesignSection project={project} />
                <DataSection project={project} />
                {report.perResponse.map((entry, i) => (
                  <AnalysisSection
                    key={entry.name}
                    project={project}
                    entry={entry}
                    findings={findingsList[i]}
                  />
                ))}
                {report.optimization && (
                  <OptimizationSection
                    project={project}
                    optimization={report.optimization}
                    goals={goals}
                  />
                )}
                <NotesSection project={project} />
                <GlossaryAppendix />
              </ReportShell>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
