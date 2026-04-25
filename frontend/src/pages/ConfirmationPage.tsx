import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Plus, Trash2, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useProjectStore } from '@/stores/projectStore'
import { predictPoint, runAnalysis, type PointPredictionResponse } from '@/services/api'
import { fmt, uid } from '@/lib/utils'
import { RequireProject } from '@/components/layout/RequireProject'

interface ConfirmRow {
  id: string
  factors: Record<string, number>
  observed: Record<string, number | null>
  prediction: Record<string, PointPredictionResponse>
}

export function ConfirmationPage() {
  const project = useProjectStore((s) => s.project)
  const analysisCache = useProjectStore((s) => s.analysis)
  const codedMatrix = useMemo(() => project?.designRows.map((r) => r.coded) ?? [], [project])

  const [rows, setRows] = useState<ConfirmRow[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    if (!project) return
    if (rows.length === 0) {
      const init: Record<string, number> = {}
      project.factors.forEach((f) => { init[f.name] = (f.high + f.low) / 2 })
      const obs: Record<string, number | null> = {}
      project.responses.forEach((r) => { obs[r.name] = null })
      setRows([{ id: uid(), factors: init, observed: obs, prediction: {} }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project])

  if (!project) return <RequireProject illustration="sliders" title="Open an experiment to add confirmation runs" />;

  const compute = async (rowId: string) => {
    const row = rows.find((r) => r.id === rowId)
    if (!row) return
    setLoadingId(rowId)
    const preds: Record<string, PointPredictionResponse> = {}
    for (let i = 0; i < project.responses.length; i++) {
      const r = project.responses[i]
      let terms = r.selectedTerms ?? analysisCache[i]?.terms
      if (!terms) {
        const a = await runAnalysis({
          factors: project.factors, coded_matrix: codedMatrix,
          response: r.data, response_name: r.name, model_order: r.modelOrder ?? 'linear',
        })
        terms = a.terms
      }
      preds[r.name] = await predictPoint({
        factors: project.factors, coded_matrix: codedMatrix, response: r.data,
        selected_terms: terms, point: row.factors, point_units: 'actual', alpha: 0.05,
      })
    }
    setRows((rs) => rs.map((r) => (r.id === rowId ? { ...r, prediction: preds } : r)))
    setLoadingId(null)
  }

  const updateFactor = (rowId: string, name: string, val: number) => {
    setRows((rs) => rs.map((r) =>
      r.id === rowId ? { ...r, factors: { ...r.factors, [name]: val }, prediction: {} } : r,
    ))
  }
  const updateObs = (rowId: string, name: string, val: number | null) => {
    setRows((rs) => rs.map((r) =>
      r.id === rowId ? { ...r, observed: { ...r.observed, [name]: val } } : r,
    ))
  }

  const addRow = () => {
    const init: Record<string, number> = {}
    project.factors.forEach((f) => { init[f.name] = (f.high + f.low) / 2 })
    const obs: Record<string, number | null> = {}
    project.responses.forEach((r) => { obs[r.name] = null })
    setRows((rs) => [...rs, { id: uid(), factors: init, observed: obs, prediction: {} }])
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Confirmation"
        description="Enter confirmation runs and check whether observed values fall inside the predicted intervals."
        actions={<Button size="sm" variant="outline" onClick={addRow}><Plus className="h-3.5 w-3.5" /> Add location</Button>}
      />

      {rows.map((row, idx) => (
        <Card key={row.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Confirmation Location #{idx + 1}</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => compute(row.id)} disabled={loadingId === row.id}>
                  {loadingId === row.id ? 'Predicting…' : 'Predict & compare'}
                </Button>
                {rows.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={() => setRows((rs) => rs.filter((r) => r.id !== row.id))}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <CardDescription className="text-xs mb-2">Factor settings</CardDescription>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {project.factors.map((f) => (
                  <div key={f.name}>
                    <Label className="text-xs">{f.name}</Label>
                    <Input
                      type="number" step="0.01" className="mono text-xs"
                      value={row.factors[f.name] ?? ''}
                      onChange={(e) => updateFactor(row.id, f.name, Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <CardDescription className="text-xs mb-2">Observed values & comparison</CardDescription>
              <Table>
                <THead>
                  <TR>
                    <TH>Response</TH>
                    <TH className="text-right">Predicted</TH>
                    <TH className="text-right">95% PI</TH>
                    <TH className="text-right">Observed</TH>
                    <TH>Status</TH>
                  </TR>
                </THead>
                <TBody>
                  {project.responses.map((r) => {
                    const p = row.prediction[r.name]
                    const obs = row.observed[r.name]
                    let status: 'ok' | 'fail' | 'pending' = 'pending'
                    if (p && obs !== null && p.pi_low !== null && p.pi_high !== null) {
                      status = obs >= p.pi_low && obs <= p.pi_high ? 'ok' : 'fail'
                    }
                    return (
                      <TR key={r.name}>
                        <TD>{r.name}</TD>
                        <TD className="text-right mono">{p ? fmt(p.predicted, 4) : '—'}</TD>
                        <TD className="text-right mono text-muted-foreground">
                          {p ? `[${fmt(p.pi_low, 3)}, ${fmt(p.pi_high, 3)}]` : '—'}
                        </TD>
                        <TD className="text-right">
                          <Input
                            type="number" step="0.01" className="mono text-xs h-7 w-24 text-right inline-block"
                            value={obs ?? ''}
                            onChange={(e) => updateObs(row.id, r.name, e.target.value === '' ? null : Number(e.target.value))}
                          />
                        </TD>
                        <TD>
                          {status === 'ok' && <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> within PI</Badge>}
                          {status === 'fail' && <Badge variant="default" className="bg-destructive"><XCircle className="h-3 w-3 mr-1" /> outside PI</Badge>}
                          {status === 'pending' && <Badge variant="muted">predict + observe</Badge>}
                        </TD>
                      </TR>
                    )
                  })}
                </TBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
