import { ReportPageBlock, ReportSubBlock } from './ReportShell'
import { ModelSummary } from '@/components/analysis/ModelSummary'
import { AnovaTable } from '@/components/analysis/AnovaTable'
import { CoefficientsTable } from '@/components/analysis/CoefficientsTable'
import { FitSummary } from '@/components/analysis/FitSummary'
import { NarrativeBlock } from '@/components/narrative/NarrativeBlock'
import { NormalProbPlot } from '@/components/plots/NormalProbPlot'
import { ResidualsPlot } from '@/components/plots/ResidualsPlot'
import { CooksPlot } from '@/components/plots/CooksPlot'
import { ContourPlot } from '@/components/plots/ContourPlot'
import { BoxCoxPlot } from '@/components/plots/BoxCoxPlot'
import type { ReportData } from '@/lib/reportFetcher'
import type { ResponseFindings } from '@/lib/insights'
import type { Project } from '@/types'

export function AnalysisSection({
  project, entry, findings,
}: {
  project: Project
  entry: ReportData['perResponse'][number]
  findings: ResponseFindings
}) {
  const anchor = `analysis-${entry.name.replace(/\s+/g, '-').toLowerCase()}`
  const a = entry.analysis
  const d = entry.diagnostics
  return (
    <ReportPageBlock id={anchor}>
      <h2 className="report-h2">Analysis · {entry.name}</h2>

      <ReportSubBlock>
        <ModelSummary a={a} />
      </ReportSubBlock>

      {entry.fitSummary && (
        <ReportSubBlock>
          <h3 className="report-h3">Fit summary</h3>
          <FitSummary
            data={entry.fitSummary}
            current={(project.responses.find((r) => r.name === entry.name)?.modelOrder) ?? 'linear'}
            onSelect={() => { /* read-only in report */ }}
          />
        </ReportSubBlock>
      )}

      <ReportSubBlock>
        <h3 className="report-h3">ANOVA</h3>
        <AnovaTable rows={a.anova} factors={project.factors} />
      </ReportSubBlock>

      {entry.narrative && (
        <ReportSubBlock>
          <h3 className="report-h3">Interpretation</h3>
          <NarrativeBlock items={entry.narrative.paragraphs} />
        </ReportSubBlock>
      )}

      <ReportSubBlock>
        <h3 className="report-h3">Coefficients (coded units)</h3>
        <CoefficientsTable rows={a.coefficients_coded} factors={project.factors} />
      </ReportSubBlock>

      <ReportSubBlock>
        <h3 className="report-h3">Final equation — coded units</h3>
        <pre className="mono text-[12px] whitespace-pre-wrap rounded-md bg-muted/40 p-3 break-words border border-border-soft">
          {a.equation_coded}
        </pre>
        <h3 className="report-h3 mt-3">Final equation — actual units</h3>
        <pre className="mono text-[12px] whitespace-pre-wrap rounded-md bg-muted/40 p-3 break-words border border-border-soft">
          {a.equation_actual}
        </pre>
      </ReportSubBlock>

      <ReportSubBlock>
        <h3 className="report-h3">Diagnostics</h3>
        <div className="grid grid-cols-2 gap-3">
          <PlotFrame title="Normal probability of residuals">
            <NormalProbPlot theoretical={d.normal_theoretical} ordered={d.normal_ordered} />
          </PlotFrame>
          <PlotFrame title="Residuals vs predicted">
            <ResidualsPlot x={d.fitted} y={d.studentized} xLabel="Predicted" />
          </PlotFrame>
          <PlotFrame title="Residuals vs run order">
            <ResidualsPlot x={d.run_order} y={d.studentized} xLabel="Run number" />
          </PlotFrame>
          <PlotFrame title="Cook's distance">
            <CooksPlot values={d.cooks_distance} runOrder={d.run_order} />
          </PlotFrame>
        </div>
      </ReportSubBlock>

      {entry.contour?.z_values && (
        <ReportSubBlock>
          <h3 className="report-h3">
            Response surface — {project.factors[0].name} × {project.factors[1].name}
          </h3>
          <PlotFrame title="" height={360}>
            <ContourPlot
              x={entry.contour.x_values}
              y={entry.contour.y_values!}
              z={entry.contour.z_values}
              xLabel={project.factors[0].name}
              yLabel={project.factors[1].name}
              zLabel={entry.name}
              designPoints={entry.contour.design_points}
              currentPoint={entry.contour.current_point}
            />
          </PlotFrame>
        </ReportSubBlock>
      )}

      {entry.boxCox && (
        <ReportSubBlock>
          <h3 className="report-h3">Box–Cox power transform</h3>
          <PlotFrame title="" height={260}>
            <BoxCoxPlot data={entry.boxCox} />
          </PlotFrame>
        </ReportSubBlock>
      )}

      <ReportSubBlock noBreak={false}>
        <h3 className="report-h3">Key takeaways</h3>
        <ul className="space-y-1">
          {findings.bullets.map((b, i) => (
            <li
              key={i}
              className={
                b.severity === 'success' ? 'text-[12.5px] text-[hsl(var(--de-significant))]'
                : b.severity === 'warning' ? 'text-[12.5px] text-[hsl(var(--de-marginal))]'
                : b.severity === 'error' ? 'text-[12.5px] text-destructive'
                : 'text-[12.5px] text-foreground/80'
              }
            >
              • {b.text}
            </li>
          ))}
        </ul>
      </ReportSubBlock>
    </ReportPageBlock>
  )
}

function PlotFrame({ title, children, height }: { title: string; children: React.ReactNode; height?: number }) {
  const h = height ?? 240
  return (
    <div
      className="rounded-md border border-border-soft bg-card p-2 flex flex-col"
      data-report-plot
      style={{ height: `${h}px` }}
    >
      {title && <div className="text-[11px] font-medium text-muted-foreground mb-1">{title}</div>}
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  )
}
