import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type PaneLayout = '1' | '2-h' | '2-v' | '2x2' | '2x3' | '3x2'

export const PANE_COUNT: Record<PaneLayout, number> = {
  '1': 1,
  '2-h': 2,
  '2-v': 2,
  '2x2': 4,
  '2x3': 6,
  '3x2': 6,
}

/** Per-response (project, responseIdx) workspace state. */
export interface FactorsToolState {
  /** Coded values for held-constant factors (also acts as "current point"). */
  values: Record<string, number>
  /** Names of the X / Y axis factors for 2D/3D plots. */
  xFactor: string | null
  yFactor: string | null
  /** Coded vs Actual unit display. */
  units: 'coded' | 'actual'
  /** Color-by selector for diagnostic plots. */
  colorBy: string
}

/** Per-pane sub-tab choice (which view the user picked). */
export type PaneViewId =
  // Diagnostics
  | 'normal-prob'
  | 'resid-vs-pred'
  | 'resid-vs-run'
  | 'resid-vs-factor'
  | 'cooks'
  | 'leverage'
  | 'dffits'
  | 'pred-vs-actual'
  | 'box-cox'
  // Model graphs
  | 'contour'
  | 'surface'
  | 'interaction'
  | 'perturbation'
  | 'one-factor'
  | 'cube'

interface UiState {
  /** layout per (projectId|section). */
  paneLayouts: Record<string, PaneLayout>
  /** subtab per (projectId|section|paneIndex). */
  paneViews: Record<string, PaneViewId>
  /** factors-tool state per (projectId|responseIdx). */
  factorsTool: Record<string, FactorsToolState>

  setPaneLayout: (key: string, layout: PaneLayout) => void
  setPaneView: (key: string, paneIdx: number, view: PaneViewId) => void
  getPaneView: (key: string, paneIdx: number, fallback: PaneViewId) => PaneViewId
  setFactorsTool: (key: string, patch: Partial<FactorsToolState>) => void
  ensureFactorsTool: (key: string, init: FactorsToolState) => FactorsToolState
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      paneLayouts: {},
      paneViews: {},
      factorsTool: {},

      setPaneLayout: (key, layout) =>
        set((s) => ({ paneLayouts: { ...s.paneLayouts, [key]: layout } })),

      setPaneView: (key, paneIdx, view) =>
        set((s) => ({
          paneViews: { ...s.paneViews, [`${key}|${paneIdx}`]: view },
        })),

      getPaneView: (key, paneIdx, fallback) =>
        get().paneViews[`${key}|${paneIdx}`] ?? fallback,

      setFactorsTool: (key, patch) =>
        set((s) => {
          const prev = s.factorsTool[key]
          if (!prev) return s
          return {
            factorsTool: { ...s.factorsTool, [key]: { ...prev, ...patch } },
          }
        }),

      ensureFactorsTool: (key, init) => {
        const existing = get().factorsTool[key]
        if (existing) return existing
        set((s) => ({ factorsTool: { ...s.factorsTool, [key]: init } }))
        return init
      },
    }),
    {
      name: 'doe-lab-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        paneLayouts: s.paneLayouts,
        paneViews: s.paneViews,
        factorsTool: s.factorsTool,
      }),
    },
  ),
)

export function workspaceKey(projectId: string, section: string, responseIdx?: number): string {
  return responseIdx === undefined
    ? `${projectId}|${section}`
    : `${projectId}|${section}|${responseIdx}`
}
