import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Beaker,
  BookOpen,
  ChefHat,
  FileText,
  FlaskConical,
  Loader2,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { deleteProject, listProjects, loadProject, saveProject } from '@/services/db'
import { useProjectStore } from '@/stores/projectStore'
import type { Project } from '@/types'
import { EXAMPLES, buildExampleProject, type ExampleDef } from '@/data/examples'
import { Sparkline } from '@/components/ui/sparkline'

const EXAMPLE_ICONS: Record<string, React.ReactNode> = {
  'chemical-yield': <FlaskConical className="h-4 w-4" />,
  'filtration-rate': <Beaker className="h-4 w-4" />,
  'cake-recipe': <ChefHat className="h-4 w-4" />,
}

export function HomePage() {
  const navigate = useNavigate()
  const setProject = useProjectStore((s) => s.setProject)
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingExample, setLoadingExample] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void listProjects().then(setProjects)
  }, [])

  const handleOpen = async (id: string) => {
    const p = await loadProject(id)
    if (p) {
      setProject(p)
      navigate('/project/data')
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this experiment?')) return
    await deleteProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  const handleLoadExample = async (ex: ExampleDef) => {
    setLoadingExample(ex.id)
    setError(null)
    try {
      const project = await buildExampleProject(ex)
      await saveProject(project)
      setProject(project)
      const refreshed = await listProjects()
      setProjects(refreshed)
      navigate('/project/data')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoadingExample(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="DOE Lab"
        description="A free, open-source workbench for designing and analyzing experiments."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card
          className="cursor-pointer transition-all hover:border-primary hover:shadow-md group"
          onClick={() => navigate('/new')}
        >
          <CardHeader>
            <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
              <Beaker className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">Start a new experiment</CardTitle>
            <CardDescription>
              Build a factorial, fractional, CCD, or Box-Behnken design using the guided wizard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" className="px-0 text-primary group-hover:translate-x-1 transition-transform">
              Open wizard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="grid h-10 w-10 place-items-center rounded-md bg-muted">
              <FileText className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">What you can do</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <div>• Generate randomized run sheets in seconds</div>
            <div>• Fit linear, 2FI, quadratic models with full ANOVA</div>
            <div>• Inspect contour plots, 3D surfaces, and diagnostics</div>
            <div>• Optimize multi-response problems with desirability</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-sig-muted text-sig">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Try a worked example</CardTitle>
              <CardDescription>
                Three classic DOE problems with the design and data already filled in. Click one
                to load it and explore the analysis, plots, and optimization.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                disabled={loadingExample !== null}
                onClick={() => handleLoadExample(ex)}
                className="group flex flex-col items-stretch gap-3 rounded-lg border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-sm disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-md bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                    {EXAMPLE_ICONS[ex.id] ?? <Sparkles className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {ex.designType.replace(/_/g, ' ')}
                    </div>
                    <div className="font-semibold leading-tight">{ex.shortName}</div>
                  </div>
                  <Badge
                    variant={
                      ex.difficulty === 'beginner'
                        ? 'success'
                        : ex.difficulty === 'intermediate'
                          ? 'muted'
                          : 'outline'
                    }
                  >
                    {ex.difficulty}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{ex.description}</p>
                <div className="mt-auto flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {ex.factors.length} factor{ex.factors.length === 1 ? '' : 's'} ·{' '}
                    {ex.responses.length} response{ex.responses.length === 1 ? '' : 's'}
                  </span>
                  {loadingExample === ex.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent experiments</CardTitle>
          <CardDescription>Saved locally to your browser (no account needed)</CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="rounded-md bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              No experiments yet. Try a worked example above or click "Start a new experiment" to begin.
            </div>
          ) : (
            <div className="divide-y">
              {projects.map((p) => {
                const firstResp = p.responses[0]
                const trace = (firstResp?.data ?? []).filter((v): v is number => v != null && Number.isFinite(v))
                return (
                  <button
                    key={p.id}
                    onClick={() => handleOpen(p.id)}
                    className="w-full flex items-center justify-between py-3 hover:bg-muted/30 px-2 -mx-2 rounded-md text-left transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground mono">
                        {p.designType.replace(/_/g, ' ')} · {p.designRows.length} runs · {p.factors.length} factors · {new Date(p.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    {trace.length >= 2 && (
                      <Sparkline values={trace} width={96} height={28} className="ml-3 shrink-0 opacity-80" />
                    )}
                    <button
                      onClick={(e) => handleDelete(p.id, e)}
                      className="ml-2 p-2 rounded hover:bg-destructive/10 text-destructive opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
