import { useEffect, useMemo, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RampBar } from '@/components/optimization/RampBar'
import { useProjectStore } from '@/stores/projectStore'
import { optimize, runAnalysis } from '@/services/api'
import type { OptimizationSolution, ResponseGoalConfig } from '@/types'
import { EXAMPLES } from '@/data/examples'
import { RequireProject } from '@/components/layout/RequireProject'

export function RampsPage() {
  const project = useProjectStore((s) => s.project)
  const analysisCache = useProjectStore((s) => s.analysis)
  const codedMatrix = useMemo(() => project?.designRows.map((r) => r.coded) ?? [], [project])
  const [goals, setGoals] = useState<ResponseGoalConfig[]>([])
  const [solution, setSolution] = useState<OptimizationSolution | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!project) return
    const exId = project.designInfo?.exampleId as string | undefined
    const ex = exId ? EXAMPLES.find((e) => e.id === exId) : undefined
    setGoals(project.responses.map((r) => {
      const filled = r.data.filter((v): v is number => v != null && !Number.isNaN(v))
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
    }))
  }, [project])

  const handleOptimize = async () => {
    if (!project) return
    setLoading(true)
    try {
      const enriched: ResponseGoalConfig[] = []
      for (let i = 0; i < goals.length; i++) {
        let terms = goals[i].selected_terms
        if (!terms || terms.length === 0) {
          let cached = analysisCache[i]?.terms
          if (!cached) {
            const a = await runAnalysis({
              factors: project.factors, coded_matrix: codedMatrix,
              response: project.responses[i].data, response_name: goals[i].name,
              model_order: project.responses[i].modelOrder ?? 'linear',
            })
            cached = a.terms
          }
          terms = cached
        }
        enriched.push({ ...goals[i], selected_terms: terms })
      }
      const r = await optimize({
        factors: project.factors, coded_matrix: codedMatrix,
        responses: project.responses.map((r) => ({ name: r.name, data: r.data })),
        goals: enriched, n_starts: 30, seed: 42,
      })
      setSolution(r.solutions[0] ?? null)
    } finally { setLoading(false) }
  }

  if (!project) return <RequireProject illustration="sparkles" title="Open an experiment to optimize" />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Optimization Ramps"
        description="Visual desirability bars for the best solution. The predicted value sits on each ramp."
        actions={
          <Button size="sm" onClick={handleOptimize} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Find optimum
          </Button>
        }
      />

      {!solution && (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Click "Find optimum" to populate ramps.</CardContent></Card>
      )}

      {solution && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Composite desirability D = <span className="mono">{solution.composite_desirability.toFixed(4)}</span></CardTitle>
              <CardDescription className="text-xs">
                Optimal factor settings:&nbsp;
                {Object.entries(solution.factors).map(([n, v], i) => (
                  <span key={n} className="mono">
                    {i > 0 && ', '}{n}={v.toFixed(3)}
                  </span>
                ))}
              </CardDescription>
            </CardHeader>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goals.map((g) => {
              const predicted = solution.responses[g.name]
              const d = solution.individual_desirabilities[g.name] ?? 0
              if (predicted === undefined) return null
              const respUnits = project.responses.find((r) => r.name === g.name)?.units
              return (
                <RampBar
                  key={g.name}
                  name={g.name}
                  goal={g.goal}
                  lower={g.lower}
                  upper={g.upper}
                  target={g.target}
                  predicted={predicted}
                  desirability={d}
                  units={respUnits}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
