import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  BookOpen,
  Layers,
  Loader2,
  RefreshCw,
  Sigma,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TopTabs, type TopTab } from '@/components/layout/TopTabs'
import { WorkspaceShell } from '@/components/layout/WorkspaceShell'
import { PaneGrid } from '@/components/layout/PaneGrid'
import { Pane } from '@/components/layout/Pane'
import { PaneLayoutToolbar } from '@/components/layout/PaneLayoutToolbar'
import { FactorsToolDrawer } from '@/components/factors-tool/FactorsToolDrawer'
import { AnovaTable } from '@/components/analysis/AnovaTable'
import { ModelSummary } from '@/components/analysis/ModelSummary'
import { CoefficientsTable } from '@/components/analysis/CoefficientsTable'
import { FitSummary } from '@/components/analysis/FitSummary'
import { NarrativeBlock } from '@/components/narrative/NarrativeBlock'
import { NormalProbPlot } from '@/components/plots/NormalProbPlot'
import { ResidualsPlot } from '@/components/plots/ResidualsPlot'
import { ParetoChart } from '@/components/plots/ParetoChart'
import { ContourPlot } from '@/components/plots/ContourPlot'
import { SurfacePlot3D } from '@/components/plots/SurfacePlot3D'
import { PerturbationPlot } from '@/components/plots/PerturbationPlot'
import { InteractionPlot } from '@/components/plots/InteractionPlot'
import { BoxCoxPlot } from '@/components/plots/BoxCoxPlot'
import { ExampleBanner } from '@/components/examples/ExampleBanner'
import { EffectsView } from '@/components/analysis/EffectsView'
import { DiagnosticPaneContent } from '@/components/diagnostics/DiagnosticPaneContent'
import { PaneSubTabSelector } from '@/components/diagnostics/PaneSubTabSelector'
import type { PaneViewId } from '@/stores/uiStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  boxCox,
  diagnostics,
  explainAnalysis,
  fitSummary,
  predictGrid,
  runAnalysis,
} from '@/services/api'
import { useProjectStore } from '@/stores/projectStore'
import { useUiStore, workspaceKey } from '@/stores/uiStore'
import type {
  BoxCoxResponse,
  ModelOrder,
  NarrativeResponse,
  PredictionGridResponse,
} from '@/types'
import { fmt } from '@/lib/utils'
import { useDebouncedFactors } from '@/hooks/useDebouncedFactors'
import { RequireProject } from '@/components/layout/RequireProject'
import { Skeleton } from '@/components/ui/skeleton'

const MODEL_LABELS: Record<ModelOrder, string> = {
  mean: 'Mean',
  linear: 'Linear',
  '2fi': '2FI',
  quadratic: 'Quadratic',
  cubic: 'Cubic',
}

type AnalysisTab = 'configure' | 'effects' | 'anova' | 'diagnostics' | 'graphs'

export function AnalysisPage() {
  const navigate = useNavigate()
  const { tab } = useParams<{ tab?: string }>()
  const activeTab: AnalysisTab = (tab as AnalysisTab) || 'anova'

  const project = useProjectStore((s) => s.project)
  const idx = useProjectStore((s) => s.selectedResponseIdx)
  const fitMap = useProjectStore((s) => s.fitSummary)
  const setFitMap = useProjectStore((s) => s.setFitSummary)
  const analysisMap = useProjectStore((s) => s.analysis)
  const setAnalysis = useProjectStore((s) => s.setAnalysis)
  const diagMap = useProjectStore((s) => s.diagnostics)
  const setDiag = useProjectStore((s) => s.setDiagnostics)
  const setOrder = useProjectStore((s) => s.setModelOrder)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [narrative, setNarrative] = useState<NarrativeResponse | null>(null)
  const [bc, setBc] = useState<BoxCoxResponse | null>(null)

  const response = project?.responses[idx]
  const order: ModelOrder = response?.modelOrder ?? 'linear'
  const analysis = analysisMap[idx]
  const diag = diagMap[idx]
  const fs = fitMap[idx]

  const codedMatrix = useMemo(
    () => project?.designRows.map((r) => r.coded) ?? [],
    [project],
  )

  const filledCount =
    response?.data.filter((v) => v !== null && v !== undefined && !Number.isNaN(v)).length ?? 0

  const setActiveTab = (t: AnalysisTab) => navigate(`/project/analysis/${t}`)

  const runFitSummary = async () => {
    if (!project || !response) return
    setLoading(true); setError(null)
    try {
      const r = await fitSummary({
        factors: project.factors, coded_matrix: codedMatrix, response: response.data,
      })
      setFitMap(idx, r)
      if (!response.modelOrder) setOrder(idx, r.suggested)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }

  const runFullAnalysis = async () => {
    if (!project || !response) return
    setLoading(true); setError(null)
    try {
      const a = await runAnalysis({
        factors: project.factors, coded_matrix: codedMatrix, response: response.data,
        response_name: response.name, model_order: order,
        selected_terms: response.selectedTerms, alpha: 0.05,
      })
      setAnalysis(idx, a)
      const d = await diagnostics({
        factors: project.factors, coded_matrix: codedMatrix, response: response.data,
        selected_terms: a.terms,
      })
      setDiag(idx, d)
      const lof = a.anova.find((r) => r.source === 'Lack of Fit')
      const n = await explainAnalysis({
        anova: a.anova,
        r_squared: a.r_squared,
        adj_r_squared: a.adj_r_squared,
        pred_r_squared: a.pred_r_squared,
        adeq_precision: a.adeq_precision,
        shapiro_p: d.shapiro_p,
        lack_of_fit_p: lof?.p_value ?? null,
        cv_percent: a.cv_percent,
        n_obs: a.n_obs,
        response_name: response.name,
      })
      setNarrative(n)
    } catch (e) {
      const msg = (e as Error & { response?: { data?: { detail?: string } } }).response?.data?.detail
      setError(msg || (e as Error).message)
    } finally { setLoading(false) }
  }

  const refreshBoxCox = async () => {
    if (!response) return
    const cleaned = response.data.filter(
      (v): v is number => v !== null && v !== undefined && !Number.isNaN(v),
    )
    if (cleaned.length < 4) return
    const r = await boxCox(cleaned)
    setBc(r)
  }

  if (!project || !response) return <RequireProject illustration="chart" title="Open an experiment to start analyzing" />;

  const tabs: TopTab[] = [
    { id: 'configure', label: 'Configure', icon: <SlidersHorizontal className="h-3.5 w-3.5" /> },
    { id: 'effects', label: 'Effects', icon: <Sigma className="h-3.5 w-3.5" /> },
    { id: 'anova', label: 'ANOVA', icon: <BookOpen className="h-3.5 w-3.5" /> },
    { id: 'diagnostics', label: 'Diagnostics', icon: <Activity className="h-3.5 w-3.5" /> },
    { id: 'graphs', label: 'Model Graphs', icon: <Layers className="h-3.5 w-3.5" /> },
  ]

  if (filledCount < 4) {
    return (
      <WorkspaceShell
        topTabs={<TopTabs tabs={tabs} activeId={activeTab} onChange={(id) => setActiveTab(id as AnalysisTab)} />}
        paneArea={
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Enter at least 4 response values in the Data tab to enable analysis.
            </CardContent>
          </Card>
        }
      />
    )
  }

  // Tab-specific content
  let pageContent: React.ReactNode = null
  let drawer: React.ReactNode | undefined = undefined

  if (activeTab === 'configure') {
    pageContent = (
      <ConfigureTab
        order={order}
        nFactors={project.factors.length}
        fs={fs}
        onLoadFitSummary={runFitSummary}
        onSelectOrder={(o) => setOrder(idx, o)}
        loading={loading}
        responseName={response.name}
        runFull={runFullAnalysis}
      />
    )
  } else if (activeTab === 'effects') {
    pageContent = <EffectsView responseIdx={idx} />
  } else if (activeTab === 'anova') {
    pageContent = (
      <AnovaTab
        analysis={analysis}
        narrative={narrative}
        bc={bc}
        onComputeBoxCox={refreshBoxCox}
        factors={project.factors}
      />
    )
  } else if (activeTab === 'diagnostics') {
    pageContent = (
      <DiagnosticsTab
        project={project}
        responseIdx={idx}
        analysis={analysis}
        diag={diag}
        bc={bc}
        codedMatrix={codedMatrix}
      />
    )
    drawer = <FactorsToolDrawer section="diagnostics" responseIdx={idx} showAxes={false} />
  } else {
    // Model Graphs
    pageContent = (
      <ModelGraphsTab
        project={project}
        responseIdx={idx}
        analysis={analysis}
        codedMatrix={codedMatrix}
      />
    )
    drawer = <FactorsToolDrawer section="analysis" responseIdx={idx} showAxes />
  }

  return (
    <WorkspaceShell
      topTabs={
        <TopTabs
          tabs={tabs}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as AnalysisTab)}
          rightContent={
            <>
              <Badge variant="muted" className="mr-1">{filledCount}/{response.data.length} obs</Badge>
              <Button size="sm" onClick={runFullAnalysis} disabled={loading || filledCount < 4}>
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Run analysis
              </Button>
            </>
          }
        />
      }
      paneArea={
        <div className="h-full overflow-auto scroll-thin">
          {error && (
            <div className="mb-2 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-[12px] text-destructive">
              {error}
            </div>
          )}
          <ExampleBanner />
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2"
            >
              {pageContent}
            </motion.div>
          </AnimatePresence>
        </div>
      }
      rightDrawer={drawer}
    />
  )
}

function ConfigureTab({
  order, nFactors, fs, onLoadFitSummary, onSelectOrder, loading, responseName, runFull,
}: {
  order: ModelOrder
  nFactors: number
  fs?: import('@/types').FitSummaryResponse
  onLoadFitSummary: () => void
  onSelectOrder: (o: ModelOrder) => void
  loading: boolean
  responseName: string
  runFull: () => void
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Model order</CardTitle>
              <CardDescription className="text-xs">
                Choose the highest-order terms to include in the model for {responseName}.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Order:</Label>
              <Select className="w-32" value={order} onChange={(e) => onSelectOrder(e.target.value as ModelOrder)}>
                {(['linear', '2fi', 'quadratic'] as const).map((o) => (
                  <option key={o} value={o}>{MODEL_LABELS[o]}</option>
                ))}
                {nFactors >= 3 && <option value="cubic">Cubic</option>}
              </Select>
              <Button size="sm" onClick={runFull} disabled={loading}>
                Refit
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Fit summary</CardTitle>
              <CardDescription className="text-xs">
                Compare candidate model orders. Click a row to choose.
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={onLoadFitSummary} disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Build summary
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fs ? (
            <FitSummary data={fs} current={order} onSelect={onSelectOrder} />
          ) : (
            <div className="rounded-md bg-muted/30 p-4 text-sm text-muted-foreground text-center">
              Click "Build summary" to compare candidate models.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AnovaTab({
  analysis, narrative, bc, onComputeBoxCox, factors,
}: {
  analysis?: import('@/types').AnalysisResponse
  narrative: NarrativeResponse | null
  bc: BoxCoxResponse | null
  onComputeBoxCox: () => void
  factors: import('@/types').Factor[]
}) {
  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Click "Run analysis" to compute the ANOVA.
        </CardContent>
      </Card>
    )
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: ANOVA + narrative + coefficients */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">ANOVA — analysis of variance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AnovaTable rows={analysis.anova} factors={factors} />
          </CardContent>
        </Card>

        {narrative && (
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
              Interpretation
            </div>
            <NarrativeBlock items={narrative.paragraphs} />
          </div>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Coefficients & equations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="coded" className="px-3 py-2">
              <TabsList>
                <TabsTrigger value="coded">Coefficients</TabsTrigger>
                <TabsTrigger value="eq-coded">Equation (coded)</TabsTrigger>
                <TabsTrigger value="eq-actual">Equation (actual)</TabsTrigger>
              </TabsList>
              <TabsContent value="coded">
                <div className="-mx-3">
                  <CoefficientsTable rows={analysis.coefficients_coded} factors={factors} />
                </div>
              </TabsContent>
              <TabsContent value="eq-coded">
                <pre className="mono text-[12px] whitespace-pre-wrap rounded-md bg-muted/40 p-3 break-words border">
                  {analysis.equation_coded}
                </pre>
              </TabsContent>
              <TabsContent value="eq-actual">
                <pre className="mono text-[12px] whitespace-pre-wrap rounded-md bg-muted/40 p-3 break-words border">
                  {analysis.equation_actual}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Box–Cox transformation</CardTitle>
                <CardDescription className="text-xs">Optimal λ to stabilize variance.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={onComputeBoxCox}>Compute</Button>
            </div>
          </CardHeader>
          <CardContent>
            {bc ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">λ = {bc.lambda_best.toFixed(2)}</Badge>
                  <Badge variant="muted">95% CI: [{bc.lambda_ci_low.toFixed(2)}, {bc.lambda_ci_high.toFixed(2)}]</Badge>
                  <Badge variant="outline">Recommendation: {bc.recommendation}</Badge>
                </div>
                <BoxCoxPlot data={bc} />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Click "Compute" to evaluate λ.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: sticky Fit Statistics card */}
      <div className="lg:col-span-1">
        <div className="sticky top-2 space-y-3">
          <ModelSummary a={analysis} />
        </div>
      </div>
    </div>
  )
}

const DIAGNOSTIC_DEFAULTS: PaneViewId[] = [
  'normal-prob', 'resid-vs-pred', 'resid-vs-run', 'cooks', 'leverage', 'pred-vs-actual',
]

function DiagnosticsTab({
  project, responseIdx, analysis, diag, bc, codedMatrix,
}: {
  project: import('@/types').Project
  responseIdx: number
  analysis?: import('@/types').AnalysisResponse
  diag?: import('@/types').DiagnosticsResponse
  bc?: BoxCoxResponse | null
  codedMatrix: number[][]
}) {
  const layoutKey = workspaceKey(project.id, 'analysis-diag', responseIdx)
  const layout = useUiStore((s) => s.paneLayouts[layoutKey] ?? '2x2')
  const setLayout = useUiStore((s) => s.setPaneLayout)
  const setPaneView = useUiStore((s) => s.setPaneView)
  const getPaneView = useUiStore((s) => s.getPaneView)

  if (!analysis || !diag) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Click "Run analysis" to compute diagnostics.
        </CardContent>
      </Card>
    )
  }

  const renderPane = (i: number) => {
    const view = getPaneView(layoutKey, i, DIAGNOSTIC_DEFAULTS[i] ?? 'normal-prob')
    return (
      <Pane
        flush
        title={
          <PaneSubTabSelector value={view} onChange={(v) => setPaneView(layoutKey, i, v)} />
        }
      >
        <DiagnosticPaneContent
          view={view}
          diag={diag}
          analysis={analysis}
          bc={bc}
          factors={project.factors}
          factorIndex={0}
          codedMatrix={codedMatrix}
        />
      </Pane>
    )
  }

  return (
    <div className="space-y-2 h-[calc(100vh-200px)] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span>Layout</span>
          <PaneLayoutToolbar value={layout} onChange={(l) => setLayout(layoutKey, l)} />
        </div>
        {diag.shapiro_p !== null && (
          <div className="text-[11px] text-muted-foreground">
            Shapiro–Wilk: W={fmt(diag.shapiro_stat, 3)}, p={fmt(diag.shapiro_p, 4)}
            {diag.shapiro_p > 0.05 ? ' (normal)' : ' (deviates — try Box–Cox)'}
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0">
        <PaneGrid layout={layout} renderPane={renderPane} />
      </div>
    </div>
  )
}

function ModelGraphsTab({
  project, responseIdx, analysis, codedMatrix,
}: {
  project: import('@/types').Project
  responseIdx: number
  analysis?: import('@/types').AnalysisResponse
  codedMatrix: number[][]
}) {
  const response = project.responses[responseIdx]
  const key = workspaceKey(project.id, 'analysis-graphs', responseIdx)
  const layout = useUiStore((s) => s.paneLayouts[key] ?? '2x2')
  const setLayout = useUiStore((s) => s.setPaneLayout)
  const factorsKey = workspaceKey(project.id, 'analysis', responseIdx)
  const tool = useUiStore((s) => s.factorsTool[factorsKey])

  // Debounced factors-tool values for plot fetching
  const debouncedTool = useDebouncedFactors(tool, 200)
  const [grid, setGrid] = useState<PredictionGridResponse | null>(null)
  const [perturb, setPerturb] = useState<PredictionGridResponse | null>(null)
  const [gridError, setGridError] = useState<string | null>(null)

  useEffect(() => {
    if (!analysis || !response || !debouncedTool || !debouncedTool.xFactor) return
    const xF = debouncedTool.xFactor
    const yF = debouncedTool.yFactor || project.factors.find((f) => f.name !== xF)?.name || null
    setGridError(null)
    predictGrid({
      factors: project.factors,
      coded_matrix: codedMatrix,
      response: response.data,
      selected_terms: analysis.terms,
      x_factor: xF,
      y_factor: yF,
      held_constant: debouncedTool.values,
      held_constant_units: 'coded',
      grid_size: 28,
    })
      .then(setGrid)
      .catch((e: any) => {
        setGrid(null)
        const detail = e?.response?.data?.detail ?? e?.message ?? 'Failed to compute prediction grid'
        setGridError(typeof detail === 'string' ? detail : JSON.stringify(detail))
        console.error('predictGrid (contour/surface) failed:', e?.response?.data ?? e)
      })
    predictGrid({
      factors: project.factors,
      coded_matrix: codedMatrix,
      response: response.data,
      selected_terms: analysis.terms,
      x_factor: project.factors[0].name,
      y_factor: null,
      held_constant: debouncedTool.values,
      held_constant_units: 'coded',
      grid_size: 28,
    })
      .then(setPerturb)
      .catch((e: Error) => {
        setPerturb(null)
        console.error('predictGrid (perturbation) failed:', e)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTool?.xFactor, debouncedTool?.yFactor, JSON.stringify(debouncedTool?.values), analysis?.terms?.join(',')])

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Run analysis to enable model graphs.
        </CardContent>
      </Card>
    )
  }

  const xF = tool?.xFactor || project.factors[0]?.name || ''
  const yF = tool?.yFactor || project.factors[1]?.name || ''
  const zLabel = response.name

  const fallback = gridError ? <PaneError message={gridError} /> : <PaneSkeleton />

  const PANES = [
    {
      key: 'contour',
      title: `Contour: ${response.name} vs ${xF} & ${yF}`,
      content: grid?.z_values ? (
        <ContourPlot
          x={grid.x_values} y={grid.y_values!} z={grid.z_values}
          xLabel={xF} yLabel={yF} zLabel={zLabel}
          designPoints={grid.design_points} currentPoint={grid.current_point}
          compact
        />
      ) : fallback,
    },
    {
      key: 'surface',
      title: `3D Surface`,
      content: grid?.z_values ? (
        <SurfacePlot3D
          x={grid.x_values} y={grid.y_values!} z={grid.z_values}
          xLabel={xF} yLabel={yF} zLabel={zLabel}
          designPoints={grid.design_points} currentPoint={grid.current_point}
          compact
        />
      ) : fallback,
    },
    {
      key: 'interaction',
      title: `Interaction (${xF} × ${yF})`,
      content: grid?.z_values ? (
        <InteractionPlot
          x={grid.x_values} y={grid.y_values!} z={grid.z_values}
          xLabel={xF} yLabel={yF} zLabel={zLabel}
        />
      ) : fallback,
    },
    {
      key: 'perturbation',
      title: 'Perturbation',
      subtitle: 'one-factor-at-a-time',
      content: perturb?.perturbation ? (
        <PerturbationPlot data={perturb.perturbation} yLabel={zLabel} />
      ) : fallback,
    },
  ]

  const renderPane = (i: number) => {
    const def = PANES[i % PANES.length]
    return <Pane title={def.title} subtitle={def.subtitle} flush>{def.content}</Pane>
  }

  return (
    <div className="space-y-2 h-[calc(100vh-200px)] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span>Layout</span>
          <PaneLayoutToolbar value={layout} onChange={(l) => setLayout(key, l)} />
        </div>
        <div className="text-[11px] text-muted-foreground">
          Drag the Factors Tool sliders → plots update live with design points overlaid.
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <PaneGrid layout={layout} renderPane={renderPane} />
      </div>
    </div>
  )
}

function PaneSkeleton() {
  return <Skeleton variant="plot" className="h-full" />
}

function PaneError({ message }: { message: string }) {
  return (
    <div className="h-full overflow-auto p-3">
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-[11px] text-destructive">
        <div className="font-semibold mb-1 text-[12px]">Could not compute prediction grid</div>
        <pre className="text-destructive/80 whitespace-pre-wrap break-words font-mono text-[10.5px] leading-snug">{message}</pre>
      </div>
    </div>
  )
}
