import { useEffect, useMemo, useState } from 'react'
import { Crosshair, Loader2, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { IntervalBar } from '@/components/prediction/IntervalBar'
import { useProjectStore } from '@/stores/projectStore'
import { predictPoint, runAnalysis, type PointPredictionResponse } from '@/services/api'
import { fmt } from '@/lib/utils'
import { RequireProject } from '@/components/layout/RequireProject'

export function PointPredictionPage() {
  const project = useProjectStore((s) => s.project)
  const analysisCache = useProjectStore((s) => s.analysis)
  const [point, setPoint] = useState<Record<string, number>>({})
  const [results, setResults] = useState<Record<string, PointPredictionResponse>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const codedMatrix = useMemo(
    () => project?.designRows.map((r) => r.coded) ?? [],
    [project],
  )

  useEffect(() => {
    if (!project) return
    const init: Record<string, number> = {}
    project.factors.forEach((f) => { init[f.name] = (f.high + f.low) / 2 })
    setPoint(init)
  }, [project])

  if (!project) return <RequireProject illustration="sliders" title="Open an experiment to predict response values" />;

  const handlePredict = async () => {
    setLoading(true); setError(null)
    try {
      const out: Record<string, PointPredictionResponse> = {}
      for (let i = 0; i < project.responses.length; i++) {
        const r = project.responses[i]
        let terms = r.selectedTerms
        if (!terms || terms.length === 0) {
          const cached = analysisCache[i]
          terms = cached?.terms
          if (!terms) {
            const a = await runAnalysis({
              factors: project.factors, coded_matrix: codedMatrix,
              response: r.data, response_name: r.name,
              model_order: r.modelOrder ?? 'linear',
            })
            terms = a.terms
          }
        }
        out[r.name] = await predictPoint({
          factors: project.factors, coded_matrix: codedMatrix, response: r.data,
          selected_terms: terms!, point, point_units: 'actual', alpha: 0.05,
        })
      }
      setResults(out)
    } catch (e) {
      const msg = (e as Error & { response?: { data?: { detail?: string } } }).response?.data?.detail
      setError(msg || (e as Error).message)
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Point Prediction"
        description="Predict response values at any factor combination with confidence, prediction, and tolerance intervals."
        actions={
          <Button size="sm" onClick={handlePredict} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Predict
          </Button>
        }
      />

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-[12px] text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Factor settings</CardTitle>
          </div>
          <CardDescription className="text-xs">Enter factor values in their actual units.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {project.factors.map((f) => (
              <div key={f.name}>
                <Label className="text-xs">{f.name} {f.units && <span className="text-muted-foreground">({f.units})</span>}</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="mono"
                  value={point[f.name] ?? ''}
                  onChange={(e) => setPoint({ ...point, [f.name]: Number(e.target.value) })}
                />
                <div className="text-[10px] text-muted-foreground mt-0.5">range: [{fmt(f.low, 3)}, {fmt(f.high, 3)}]</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {Object.keys(results).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {project.responses.map((r) => {
            const res = results[r.name]
            if (!res) return null
            return (
              <Card key={r.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{r.name}</CardTitle>
                  <CardDescription className="text-xs">
                    Predicted = <span className="mono font-semibold text-foreground">{fmt(res.predicted, 4)}</span>
                    {' · '}SE(mean) = <span className="mono">{fmt(res.std_error, 4)}</span>
                    {' · '}df = {res.df_residual}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <IntervalBar
                    predicted={res.predicted}
                    ciLow={res.ci_low} ciHigh={res.ci_high}
                    piLow={res.pi_low} piHigh={res.pi_high}
                    tiLow={res.ti_low} tiHigh={res.ti_high}
                    unit={r.units}
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
