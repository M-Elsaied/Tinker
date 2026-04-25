import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Beaker,
  BookOpen,
  ChartScatter,
  CheckCircle2,
  Crosshair,
  FileBarChart,
  FileText,
  Grid3x3,
  Home,
  Info,
  Layers,
  LineChart,
  Plus,
  Settings2,
  Sigma,
  SlidersHorizontal,
  Sparkles,
  Table2,
  Target,
} from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { DensityToggle } from '@/components/ui/density-toggle'
import { KeyboardHint } from '@/components/ui/keyboard-hint'
import { HierarchicalTree, type TreeNode } from './HierarchicalTree'

const ICON_SIZE = 'h-3.5 w-3.5'

export function Sidebar() {
  const project = useProjectStore((s) => s.project)
  const setSelectedResponse = useProjectStore((s) => s.setSelectedResponse)
  const analysisCache = useProjectStore((s) => s.analysis)
  const navigate = useNavigate()

  const path = window.location.pathname

  const handleSelect = (id: string) => {
    if (id.startsWith('nav:')) {
      navigate(id.slice(4))
      return
    }
    if (id.startsWith('response:')) {
      const [, idxStr, sub] = id.split(':')
      setSelectedResponse(Number(idxStr))
      navigate(`/project/analysis/${sub || 'anova'}`)
      return
    }
  }

  const nodes: TreeNode[] = [
    {
      id: 'workspace',
      label: 'Workspace',
      defaultOpen: true,
      children: [
        { id: 'nav:/', label: 'Home', icon: <Home className={ICON_SIZE} /> },
        { id: 'nav:/new', label: 'New design', icon: <Plus className={ICON_SIZE} /> },
      ],
    },
  ]

  if (project) {
    nodes.push({
      id: 'design',
      label: project.name,
      defaultOpen: true,
      children: [
        { id: 'nav:/project/design', label: 'Design', icon: <Grid3x3 className={ICON_SIZE} /> },
        { id: 'nav:/project/data', label: 'Data', icon: <Table2 className={ICON_SIZE} /> },
        { id: 'nav:/project/notes', label: 'Notes', icon: <FileText className={ICON_SIZE} /> },
        { id: 'nav:/project/evaluation', label: 'Evaluation', icon: <Info className={ICON_SIZE} /> },
      ],
    })

    nodes.push({
      id: 'analysis',
      label: 'Analysis',
      defaultOpen: true,
      children: project.responses.map((r, i) => {
        const analyzed = !!analysisCache[i]
        return {
          id: `r${i}`,
          label: r.name,
          icon: <LineChart className={ICON_SIZE} />,
          defaultOpen: i === 0,
          badge: analyzed ? (
            <Badge variant="success" className="text-[9px] px-1.5 py-0">analyzed</Badge>
          ) : undefined,
          children: [
            { id: `response:${i}:configure`, label: 'Configure', icon: <SlidersHorizontal className={ICON_SIZE} /> },
            { id: `response:${i}:effects`, label: 'Effects', icon: <Sigma className={ICON_SIZE} /> },
            { id: `response:${i}:anova`, label: 'ANOVA', icon: <BookOpen className={ICON_SIZE} /> },
            { id: `response:${i}:diagnostics`, label: 'Diagnostics', icon: <Activity className={ICON_SIZE} /> },
            { id: `response:${i}:graphs`, label: 'Model Graphs', icon: <Layers className={ICON_SIZE} /> },
          ],
        }
      }),
    })

    nodes.push({
      id: 'post',
      label: 'Post Analysis',
      defaultOpen: false,
      children: [
        { id: 'nav:/project/profiler', label: 'Profiler', icon: <SlidersHorizontal className={ICON_SIZE} /> },
        { id: 'nav:/project/prediction', label: 'Point Prediction', icon: <Crosshair className={ICON_SIZE} /> },
        { id: 'nav:/project/confirmation', label: 'Confirmation', icon: <CheckCircle2 className={ICON_SIZE} /> },
        { id: 'nav:/project/custom-graphs', label: 'Custom Graphs', icon: <ChartScatter className={ICON_SIZE} /> },
      ],
    })

    nodes.push({
      id: 'optim',
      label: 'Optimization',
      defaultOpen: true,
      children: [
        { id: 'nav:/project/optimize', label: 'Numerical', icon: <Target className={ICON_SIZE} /> },
        { id: 'nav:/project/ramps', label: 'Ramps', icon: <Sparkles className={ICON_SIZE} /> },
        { id: 'nav:/project/overlay', label: 'Graphical', icon: <ChartScatter className={ICON_SIZE} /> },
      ],
    })

    nodes.push({
      id: 'export',
      label: 'Export',
      defaultOpen: true,
      children: [
        { id: 'nav:/project/report', label: 'Report', icon: <FileBarChart className={ICON_SIZE} /> },
      ],
    })
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-card">
      <div className="flex items-center gap-2 px-3 py-3 border-b">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
          <Beaker className="h-4 w-4" />
        </div>
        <div>
          <div className="font-semibold leading-tight text-[14px]">DOE Lab</div>
          <div className="text-[10px] text-muted-foreground">Free DOE Suite</div>
        </div>
      </div>

      <nav className="flex-1 overflow-auto scroll-thin px-2">
        <HierarchicalTree nodes={nodes} activePath={path} onSelect={handleSelect} />
      </nav>

      <div className="border-t p-2 space-y-2">
        <div className="flex items-center justify-between gap-1">
          <ThemeToggle />
          <DensityToggle />
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <span>Quick actions</span>
          <KeyboardHint keys={['mod', 'k']} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-[12px]"
          onClick={() => navigate('/about')}
        >
          <Settings2 className="h-3.5 w-3.5" />
          About
        </Button>
      </div>
    </aside>
  )
}
