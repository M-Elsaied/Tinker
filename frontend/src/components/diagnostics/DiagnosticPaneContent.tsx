import { NormalProbPlot } from '@/components/plots/NormalProbPlot'
import { ResidualsPlot } from '@/components/plots/ResidualsPlot'
import { ParetoChart } from '@/components/plots/ParetoChart'
import { CooksPlot } from '@/components/plots/CooksPlot'
import { LeveragePlot } from '@/components/plots/LeveragePlot'
import { DFFITSPlot } from '@/components/plots/DFFITSPlot'
import { PredVsActualPlot } from '@/components/plots/PredVsActualPlot'
import { ResidVsFactorPlot } from '@/components/plots/ResidVsFactorPlot'
import { BoxCoxPlot } from '@/components/plots/BoxCoxPlot'
import type {
  AnalysisResponse,
  BoxCoxResponse,
  DiagnosticsResponse,
  Factor,
  PaneViewId,
} from '@/types'
import type { PaneViewId as StorePaneViewId } from '@/stores/uiStore'

type ViewId = StorePaneViewId

interface Props {
  view: ViewId
  diag: DiagnosticsResponse
  analysis: AnalysisResponse
  bc?: BoxCoxResponse | null
  factors: Factor[]
  factorIndex: number  // index of factor for "resid vs factor"
  codedMatrix: number[][]
}

export function DiagnosticPaneContent({
  view, diag, analysis, bc, factors, factorIndex, codedMatrix,
}: Props) {
  switch (view) {
    case 'normal-prob':
      return <NormalProbPlot theoretical={diag.normal_theoretical} ordered={diag.normal_ordered} />
    case 'resid-vs-pred':
      return <ResidualsPlot x={diag.fitted} y={diag.studentized} xLabel="Predicted" />
    case 'resid-vs-run':
      return <ResidualsPlot x={diag.run_order} y={diag.studentized} xLabel="Run number" />
    case 'resid-vs-factor': {
      const f = factors[factorIndex] ?? factors[0]
      const xVals = codedMatrix.map((row) => {
        const c = row[factorIndex] ?? 0
        return c * (f.high - f.low) / 2 + (f.high + f.low) / 2
      })
      return <ResidVsFactorPlot factor={xVals.slice(0, diag.studentized.length)} residuals={diag.studentized} factorName={f.name} />
    }
    case 'cooks':
      return <CooksPlot values={diag.cooks_distance} runOrder={diag.run_order} />
    case 'leverage':
      return <LeveragePlot values={diag.leverage} pTerms={analysis.terms.length + 1} runOrder={diag.run_order} />
    case 'dffits':
      return <DFFITSPlot values={diag.dffits} pTerms={analysis.terms.length + 1} runOrder={diag.run_order} />
    case 'pred-vs-actual': {
      // We don't have y values directly here — derive from residuals + fitted
      const actual = diag.fitted.map((p, i) => p + diag.residuals[i])
      return <PredVsActualPlot predicted={diag.fitted} actual={actual} />
    }
    case 'box-cox':
      return bc ? <BoxCoxPlot data={bc} /> : <Empty msg="Compute Box-Cox first." />
    default:
      return <ParetoChart coefficients={analysis.coefficients_coded} dfResid={analysis.df_residual} factors={factors} />
  }
}

function Empty({ msg }: { msg: string }) {
  return <div className="grid place-items-center h-full text-xs text-muted-foreground">{msg}</div>
}

// Re-export for type imports
export type { ViewId }
