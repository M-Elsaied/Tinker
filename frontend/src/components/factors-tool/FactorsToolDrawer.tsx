import { useEffect, useMemo } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FactorSlider } from './FactorSlider'
import { useUiStore, workspaceKey, type FactorsToolState } from '@/stores/uiStore'
import { useProjectStore } from '@/stores/projectStore'

interface Props {
  /** Section that owns this factors-tool state, e.g. 'analysis'. */
  section: string
  responseIdx: number
  /** Show axis assignment role badges (X/Y) — only meaningful for Model Graphs. */
  showAxes?: boolean
  className?: string
}

export function FactorsToolDrawer({ section, responseIdx, showAxes = true, className }: Props) {
  const project = useProjectStore((s) => s.project)
  const ensureFactorsTool = useUiStore((s) => s.ensureFactorsTool)
  const setFactorsTool = useUiStore((s) => s.setFactorsTool)
  const allTool = useUiStore((s) => s.factorsTool)

  const key = project ? workspaceKey(project.id, section, responseIdx) : ''
  const initial = useMemo<FactorsToolState | null>(() => {
    if (!project) return null
    const values: Record<string, number> = {}
    project.factors.forEach((f) => { values[f.name] = 0 })
    return {
      values,
      xFactor: project.factors[0]?.name ?? null,
      yFactor: project.factors[1]?.name ?? null,
      units: 'actual',
      colorBy: 'run',
    }
  }, [project])

  useEffect(() => {
    if (key && initial) ensureFactorsTool(key, initial)
  }, [key, initial, ensureFactorsTool])

  if (!project || !initial) return null
  const tool: FactorsToolState = allTool[key] ?? initial

  const codedToActual = (factorName: string, coded: number): number => {
    const f = project.factors.find((g) => g.name === factorName)!
    const center = (f.high + f.low) / 2
    const half = (f.high - f.low) / 2
    return center + coded * half
  }

  const handleSlider = (name: string, coded: number) => {
    setFactorsTool(key, { values: { ...tool.values, [name]: coded } })
  }

  const cycleRole = (name: string) => {
    if (!showAxes) return
    if (tool.xFactor === name) {
      // X -> swap to Y if a Y exists, else become held
      const newY = tool.yFactor === name ? null : tool.yFactor
      setFactorsTool(key, { xFactor: newY, yFactor: name })
    } else if (tool.yFactor === name) {
      setFactorsTool(key, { yFactor: null })
    } else {
      // promote to X (demote previous X to held)
      setFactorsTool(key, { xFactor: name })
    }
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
        <div className="flex-1">
          <div className="text-[12.5px] font-semibold">Factors Tool</div>
          <div className="text-[10.5px] text-muted-foreground">Drag sliders to explore</div>
        </div>
        <div className="flex rounded border text-[10px]">
          <button
            className={cn('px-1.5 py-0.5', tool.units === 'coded' && 'bg-primary text-primary-foreground')}
            onClick={() => setFactorsTool(key, { units: 'coded' })}
          >
            Coded
          </button>
          <button
            className={cn('px-1.5 py-0.5', tool.units === 'actual' && 'bg-primary text-primary-foreground')}
            onClick={() => setFactorsTool(key, { units: 'actual' })}
          >
            Actual
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto scroll-thin p-2 space-y-1.5">
        {project.factors.map((f) => {
          const coded = tool.values[f.name] ?? 0
          const actual = codedToActual(f.name, coded)
          const role: 'x' | 'y' | 'held' =
            showAxes && tool.xFactor === f.name ? 'x'
            : showAxes && tool.yFactor === f.name ? 'y'
            : 'held'
          return (
            <FactorSlider
              key={f.name}
              name={f.name}
              units={f.units}
              coded={coded}
              actual={actual}
              role={role}
              onChange={(v) => handleSlider(f.name, v)}
              onRoleClick={() => cycleRole(f.name)}
              units_display={tool.units}
            />
          )
        })}
      </div>

      {showAxes && (
        <div className="border-t bg-muted/30 p-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="inline-block h-2 w-2 rounded-sm bg-primary" /> X axis
            <span className="inline-block h-2 w-2 rounded-sm bg-amber-500 ml-2" /> Y axis
          </div>
          <div>Click an axis badge to reassign factors.</div>
        </div>
      )}
    </div>
  )
}
