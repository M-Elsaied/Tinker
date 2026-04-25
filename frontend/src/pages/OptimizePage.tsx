import { useEffect, useMemo, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OptimizationSetup } from '@/components/optimization/OptimizationSetup'
import { SolutionsTable } from '@/components/optimization/SolutionsTable'
import { ExampleBanner } from '@/components/examples/ExampleBanner'
import { useProjectStore } from '@/stores/projectStore'
import { optimize, runAnalysis } from '@/services/api'
import type { OptimizationResponse, ResponseGoalConfig } from '@/types'
import { EXAMPLES } from '@/data/examples'
import { RequireProject } from '@/components/layout/RequireProject'

export function OptimizePage() {
  const project = useProjectStore((s) => s.project)
  const [goals, setGoals] = useState<ResponseGoalConfig[]>([])
  const [solutions, setSolutions] = useState<OptimizationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const codedMatrix = useMemo(
    () => project?.designRows.map((r) => r.coded) ?? [],
    [project],
  )

  useEffect(() => {
    if (!project) return
    const exId = project.designInfo?.exampleId as string | undefined
    const ex = exId ? EXAMPLES.find((e) => e.id === exId) : undefined
    setGoals(
      project.responses.map((r) => {
        const filled = r.data.filter(
          (v): v is number => v !== null && v !== undefined && !Number.isNaN(v),
        )
        const dataLow = filled.length ? Math.min(...filled) : 0
        const dataHigh = filled.length ? Math.max(...filled) : 1
        const exGoal = ex?.goals.find((g) => g.name === r.name)
        return {
          name: r.name,
          selected_terms: r.selectedTerms ?? [],
          goal: exGoal?.goal ?? 'maximize',
          lower: exGoal?.lower ?? dataLow,
          upper: exGoal?.upper ?? dataHigh,
          target: exGoal?.target ?? null,
          weight: exGoal?.weight ?? 1,
          importance: exGoal?.importance ?? 3,
        }
      }),
    )
  }, [project])

  const handleOptimize = async () => {
    if (!project) return
    setLoading(true)
    setError(null)
    try {
      // Make sure each response has terms — use linear if nothing chosen
      const enrichedGoals: ResponseGoalConfig[] = []
      for (let i = 0; i < goals.length; i++) {
        const goal = goals[i]
        let terms = goal.selected_terms
        if (!terms || terms.length === 0) {
          const a = await runAnalysis({
            factors: project.factors,
            coded_matrix: codedMatrix,
            response: project.responses[i].data,
            response_name: goal.name,
            model_order: project.responses[i].modelOrder ?? 'linear',
          })
          terms = a.terms
        }
        enrichedGoals.push({ ...goal, selected_terms: terms })
      }
      const r = await optimize({
        factors: project.factors,
        coded_matrix: codedMatrix,
        responses: project.responses.map((r) => ({ name: r.name, data: r.data })),
        goals: enrichedGoals,
        n_starts: 30,
        seed: 42,
      })
      setSolutions(r)
    } catch (e) {
      const msg = (e as Error & { response?: { data?: { detail?: string } } })
        .response?.data?.detail
      setError(msg || (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (!project) {
    return (
      <RequireProject illustration="sparkles" title="Open an experiment to optimize" description="Numerical optimization needs a fitted model — load a project first." />
    )
  }

  const responseNames = project.responses
    .filter((_, i) => goals[i]?.goal !== 'none')
    .map((r) => r.name)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Numerical optimization"
        description="Find factor settings that best satisfy your response goals using desirability functions."
        actions={
          <Button onClick={handleOptimize} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Optimize
          </Button>
        }
      />

      <ExampleBanner />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Goals</CardTitle>
          <CardDescription className="text-xs">
            Set what you want for each response. The optimizer maximizes the geometric mean
            (composite desirability).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <OptimizationSetup goals={goals} onChange={setGoals} />
        </CardContent>
      </Card>

      {solutions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top solutions</CardTitle>
            <CardDescription className="text-xs">
              Ranked by composite desirability D ∈ [0, 1]. The starred row is the best.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <SolutionsTable
              solutions={solutions.solutions}
              factorNames={project.factors.map((f) => f.name)}
              responseNames={responseNames}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
