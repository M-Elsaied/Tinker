import type { ReactNode } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import {
  Activity, Beaker, BookOpen, ChartScatter, CheckCircle2, ChefHat, Crosshair, FileBarChart, FileText,
  FlaskConical, Grid3x3, Home, Info, Layers, LineChart, Moon, Plus, Sigma, SlidersHorizontal,
  Sparkles, Sun, Table2, Target, Download,
} from 'lucide-react'
import { EXAMPLES, buildExampleProject } from '@/data/examples'
import { saveProject } from '@/services/db'
import { toast } from '@/lib/toast'

export interface Command {
  id: string
  label: string
  group: 'Navigate' | 'Project' | 'Analysis' | 'View' | 'Examples' | 'Theme'
  keywords?: string[]
  icon?: ReactNode
  shortcut?: string[]
  perform: () => void | Promise<void>
}

export interface BuildDeps {
  navigate: NavigateFunction
  project: import('@/types').Project | null
  setProject: (p: import('@/types').Project) => void
  setTheme: (c: 'light' | 'dark' | 'system') => void
  toggleTheme: () => void
  closePalette: () => void
}

export function buildCommands(deps: BuildDeps): Command[] {
  const cmds: Command[] = []
  const go = (path: string) => () => { deps.navigate(path); deps.closePalette() }

  // Navigate
  cmds.push(
    { id: 'nav-home', label: 'Home', group: 'Navigate', icon: <Home className="h-4 w-4" />, shortcut: ['g', 'h'], perform: go('/') },
    { id: 'nav-new', label: 'New design', group: 'Navigate', icon: <Plus className="h-4 w-4" />, shortcut: ['g', 'n'], perform: go('/new') },
  )

  if (deps.project) {
    cmds.push(
      { id: 'nav-design', label: 'Design', group: 'Navigate', icon: <Grid3x3 className="h-4 w-4" />, shortcut: ['g', 'd'], perform: go('/project/design') },
      { id: 'nav-data', label: 'Data', group: 'Navigate', icon: <Table2 className="h-4 w-4" />, perform: go('/project/data') },
      { id: 'nav-anova', label: 'ANOVA', group: 'Analysis', icon: <BookOpen className="h-4 w-4" />, shortcut: ['g', 'a'], perform: go('/project/analysis/anova') },
      { id: 'nav-effects', label: 'Effects', group: 'Analysis', icon: <Sigma className="h-4 w-4" />, perform: go('/project/analysis/effects') },
      { id: 'nav-diag', label: 'Diagnostics', group: 'Analysis', icon: <Activity className="h-4 w-4" />, perform: go('/project/analysis/diagnostics') },
      { id: 'nav-graphs', label: 'Model Graphs', group: 'Analysis', icon: <Layers className="h-4 w-4" />, perform: go('/project/analysis/graphs') },
      { id: 'nav-configure', label: 'Configure', group: 'Analysis', icon: <SlidersHorizontal className="h-4 w-4" />, perform: go('/project/analysis/configure') },
      { id: 'nav-profiler', label: 'Profiler', group: 'Project', icon: <SlidersHorizontal className="h-4 w-4" />, perform: go('/project/profiler') },
      { id: 'nav-prediction', label: 'Point Prediction', group: 'Project', icon: <Crosshair className="h-4 w-4" />, perform: go('/project/prediction') },
      { id: 'nav-confirm', label: 'Confirmation', group: 'Project', icon: <CheckCircle2 className="h-4 w-4" />, perform: go('/project/confirmation') },
      { id: 'nav-custom', label: 'Custom Graphs', group: 'Project', icon: <ChartScatter className="h-4 w-4" />, perform: go('/project/custom-graphs') },
      { id: 'nav-notes', label: 'Notes', group: 'Project', icon: <FileText className="h-4 w-4" />, perform: go('/project/notes') },
      { id: 'nav-eval', label: 'Evaluation', group: 'Project', icon: <Info className="h-4 w-4" />, perform: go('/project/evaluation') },
      { id: 'nav-numerical', label: 'Numerical Optimization', group: 'Project', icon: <Target className="h-4 w-4" />, shortcut: ['g', 'o'], perform: go('/project/optimize') },
      { id: 'nav-ramps', label: 'Optimization Ramps', group: 'Project', icon: <Sparkles className="h-4 w-4" />, perform: go('/project/ramps') },
      { id: 'nav-overlay', label: 'Graphical Optimization', group: 'Project', icon: <ChartScatter className="h-4 w-4" />, perform: go('/project/overlay') },
      { id: 'nav-report', label: 'Open report', group: 'Project', icon: <FileBarChart className="h-4 w-4" />, shortcut: ['g', 'r'], perform: go('/project/report') },
      { id: 'export-pdf', label: 'Export report PDF', group: 'Project', icon: <Download className="h-4 w-4" />, shortcut: ['mod', 'shift', 'e'],
        perform: () => { deps.navigate('/project/report?download=1'); deps.closePalette() } },
    )
  }

  // Examples
  for (const ex of EXAMPLES) {
    const icon = ex.id === 'chemical-yield' ? <FlaskConical className="h-4 w-4" />
      : ex.id === 'cake-recipe' ? <ChefHat className="h-4 w-4" />
      : <Beaker className="h-4 w-4" />
    cmds.push({
      id: `ex-${ex.id}`,
      label: `Open example: ${ex.shortName}`,
      group: 'Examples',
      keywords: [ex.id, ex.shortName, ex.designType, ...ex.factors.map((f) => f.name)],
      icon,
      perform: async () => {
        const promise = buildExampleProject(ex)
        toast.promise(promise, {
          loading: `Loading ${ex.shortName}...`,
          success: `${ex.shortName} loaded`,
          error: 'Failed to load example',
        })
        const project = await promise
        await saveProject(project)
        deps.setProject(project)
        deps.navigate('/project/data')
        deps.closePalette()
      },
    })
  }

  // Theme
  cmds.push(
    { id: 'theme-light', label: 'Switch to light theme', group: 'Theme', icon: <Sun className="h-4 w-4" />, perform: () => { deps.setTheme('light'); deps.closePalette() } },
    { id: 'theme-dark', label: 'Switch to dark theme', group: 'Theme', icon: <Moon className="h-4 w-4" />, perform: () => { deps.setTheme('dark'); deps.closePalette() } },
    { id: 'theme-toggle', label: 'Toggle theme', group: 'Theme', icon: <Sun className="h-4 w-4" />, shortcut: ['mod', '/'], perform: () => { deps.toggleTheme(); deps.closePalette() } },
  )

  // View
  cmds.push(
    { id: 'view-print', label: 'Print report', group: 'View', icon: <FileText className="h-4 w-4" />, shortcut: ['mod', 'p'], perform: () => { window.print(); deps.closePalette() } },
  )

  return cmds
}
