import { create } from 'zustand'
import type {
  AnalysisResponse,
  DesignType,
  DiagnosticsResponse,
  Factor,
  FitSummaryResponse,
  ModelOrder,
  Project,
  Response,
} from '@/types'
import { saveProject } from '@/services/db'
import { uid } from '@/lib/utils'

interface ProjectState {
  project: Project | null
  selectedResponseIdx: number
  // Analysis caches keyed by response index
  fitSummary: Record<number, FitSummaryResponse>
  analysis: Record<number, AnalysisResponse>
  diagnostics: Record<number, DiagnosticsResponse>

  setProject: (p: Project) => void
  newProject: (params: {
    name: string
    designType: DesignType
    factors: Factor[]
    designRows: Project['designRows']
    designInfo: Record<string, unknown>
    responseNames?: string[]
  }) => void
  updateResponseValue: (responseIdx: number, runIdx: number, value: number | null) => void
  addResponse: (name: string) => void
  removeResponse: (idx: number) => void
  renameResponse: (idx: number, name: string) => void
  setSelectedResponse: (idx: number) => void
  setSelectedTerms: (responseIdx: number, terms: string[]) => void
  setModelOrder: (responseIdx: number, order: ModelOrder) => void
  setFitSummary: (idx: number, fs: FitSummaryResponse) => void
  setAnalysis: (idx: number, a: AnalysisResponse) => void
  setDiagnostics: (idx: number, d: DiagnosticsResponse) => void
  persist: () => Promise<void>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  selectedResponseIdx: 0,
  fitSummary: {},
  analysis: {},
  diagnostics: {},

  setProject: (p) =>
    set({ project: p, selectedResponseIdx: 0, fitSummary: {}, analysis: {}, diagnostics: {} }),

  newProject: ({ name, designType, factors, designRows, designInfo, responseNames }) => {
    const responses: Response[] = (responseNames && responseNames.length
      ? responseNames
      : ['Response 1']
    ).map((rn) => ({
      name: rn,
      units: '',
      data: designRows.map(() => null),
    }))
    const project: Project = {
      id: uid(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      designType,
      factors,
      designRows,
      responses,
      designInfo,
    }
    set({ project, selectedResponseIdx: 0, fitSummary: {}, analysis: {}, diagnostics: {} })
    void saveProject(project)
  },

  updateResponseValue: (responseIdx, runIdx, value) => {
    const p = get().project
    if (!p) return
    const responses = p.responses.map((r, i) => {
      if (i !== responseIdx) return r
      const data = [...r.data]
      data[runIdx] = value
      return { ...r, data }
    })
    set({
      project: { ...p, responses, updatedAt: Date.now() },
      analysis: { ...get().analysis, [responseIdx]: undefined as unknown as AnalysisResponse },
      diagnostics: {
        ...get().diagnostics,
        [responseIdx]: undefined as unknown as DiagnosticsResponse,
      },
      fitSummary: {
        ...get().fitSummary,
        [responseIdx]: undefined as unknown as FitSummaryResponse,
      },
    })
  },

  addResponse: (name) => {
    const p = get().project
    if (!p) return
    const responses = [
      ...p.responses,
      { name, units: '', data: p.designRows.map(() => null) },
    ]
    set({ project: { ...p, responses, updatedAt: Date.now() } })
  },

  removeResponse: (idx) => {
    const p = get().project
    if (!p) return
    if (p.responses.length <= 1) return
    const responses = p.responses.filter((_, i) => i !== idx)
    set({
      project: { ...p, responses, updatedAt: Date.now() },
      selectedResponseIdx: Math.min(get().selectedResponseIdx, responses.length - 1),
    })
  },

  renameResponse: (idx, name) => {
    const p = get().project
    if (!p) return
    const responses = p.responses.map((r, i) => (i === idx ? { ...r, name } : r))
    set({ project: { ...p, responses, updatedAt: Date.now() } })
  },

  setSelectedResponse: (idx) => set({ selectedResponseIdx: idx }),

  setSelectedTerms: (responseIdx, terms) => {
    const p = get().project
    if (!p) return
    const responses = p.responses.map((r, i) =>
      i === responseIdx ? { ...r, selectedTerms: terms } : r,
    )
    set({
      project: { ...p, responses, updatedAt: Date.now() },
      analysis: { ...get().analysis, [responseIdx]: undefined as unknown as AnalysisResponse },
      diagnostics: {
        ...get().diagnostics,
        [responseIdx]: undefined as unknown as DiagnosticsResponse,
      },
    })
  },

  setModelOrder: (responseIdx, order) => {
    const p = get().project
    if (!p) return
    const responses = p.responses.map((r, i) =>
      i === responseIdx ? { ...r, modelOrder: order, selectedTerms: undefined } : r,
    )
    set({
      project: { ...p, responses, updatedAt: Date.now() },
      analysis: { ...get().analysis, [responseIdx]: undefined as unknown as AnalysisResponse },
      diagnostics: {
        ...get().diagnostics,
        [responseIdx]: undefined as unknown as DiagnosticsResponse,
      },
    })
  },

  setFitSummary: (idx, fs) => set({ fitSummary: { ...get().fitSummary, [idx]: fs } }),
  setAnalysis: (idx, a) => set({ analysis: { ...get().analysis, [idx]: a } }),
  setDiagnostics: (idx, d) => set({ diagnostics: { ...get().diagnostics, [idx]: d } }),

  persist: async () => {
    const p = get().project
    if (p) await saveProject(p)
  },
}))
