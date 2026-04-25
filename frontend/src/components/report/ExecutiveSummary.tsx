import { CheckCircle2, Lightbulb, ScrollText } from 'lucide-react'
import { ReportPageBlock, ReportSubBlock } from './ReportShell'
import type { ExecutiveSummary as ExecutiveSummaryType, ResponseFindings } from '@/lib/insights'

export function ExecutiveSummary({
  summary, perResponse,
}: {
  summary: ExecutiveSummaryType
  perResponse: ResponseFindings[]
}) {
  return (
    <ReportPageBlock id="executive">
      <h2 className="report-h2">Executive Summary</h2>

      <ReportSubBlock>
        <div className="flex items-center gap-2 mb-2">
          <ScrollText className="h-4 w-4 text-primary" />
          <h3 className="report-h3 m-0">Background</h3>
        </div>
        <p className="report-prose">{summary.intro}</p>
      </ReportSubBlock>

      <ReportSubBlock>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-4 w-4 text-[hsl(var(--de-significant))]" />
          <h3 className="report-h3 m-0">Key findings</h3>
        </div>
        {summary.findings.length === 0 && (
          <p className="report-prose text-muted-foreground">No analyses available — fit a model on each response to populate this section.</p>
        )}
        {summary.findings.map((f, i) => (
          <p key={i} className="report-prose">{f}</p>
        ))}
      </ReportSubBlock>

      <ReportSubBlock>
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <h3 className="report-h3 m-0">Recommendations</h3>
        </div>
        <ul className="list-disc pl-5 space-y-1">
          {summary.recommendations.map((r, i) => (
            <li key={i} className="text-[13px] leading-snug">{r}</li>
          ))}
        </ul>
      </ReportSubBlock>

      <ReportSubBlock>
        <h3 className="report-h3">Per-response highlights</h3>
        <div className="space-y-3">
          {perResponse.map((r) => (
            <div key={r.responseName} className="rounded-md border border-border-soft p-3">
              <div className="font-semibold text-[13px] mb-1">{r.responseName}</div>
              <ul className="space-y-1">
                {r.bullets.map((b, i) => (
                  <li
                    key={i}
                    className={
                      b.severity === 'success' ? 'text-[12px] text-[hsl(var(--de-significant))]'
                      : b.severity === 'warning' ? 'text-[12px] text-[hsl(var(--de-marginal))]'
                      : b.severity === 'error' ? 'text-[12px] text-destructive'
                      : 'text-[12px] text-foreground/80'
                    }
                  >
                    • {b.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ReportSubBlock>
    </ReportPageBlock>
  )
}
