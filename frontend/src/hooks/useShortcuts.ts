import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from './useTheme'

interface ShortcutDispatcher {
  showOverlay: () => void
}

/** Wires Vim-style g+? sequences and Ctrl+/ theme toggle.
 *  Excludes input / textarea / contentEditable from "g h" prefix to avoid accidental triggers while typing.
 */
export function useShortcuts({ showOverlay }: ShortcutDispatcher) {
  const navigate = useNavigate()
  const { toggle } = useTheme()
  const lastG = useRef<number>(0)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const tag = t?.tagName
      const inField = tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable)

      // Cmd/Ctrl combos
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        toggle()
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        navigate('/project/report?download=1')
        return
      }

      if (inField) return

      if (e.key === '?') { e.preventDefault(); showOverlay(); return }

      // g + key navigation
      const now = Date.now()
      if (e.key === 'g') {
        lastG.current = now
        return
      }
      if (now - lastG.current < 800) {
        const map: Record<string, string> = {
          h: '/',
          n: '/new',
          d: '/project/design',
          a: '/project/analysis',
          o: '/project/optimize',
          p: '/project/profiler',
          c: '/project/confirmation',
          e: '/project/evaluation',
          r: '/project/report',
        }
        const path = map[e.key.toLowerCase()]
        if (path) {
          e.preventDefault()
          lastG.current = 0
          navigate(path)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, showOverlay, toggle])
}

export function useShortcutOverlay(): { open: boolean; show: () => void; close: () => void } {
  const [open, setOpen] = useState(false)
  const show = useCallback(() => setOpen(true), [])
  const close = useCallback(() => setOpen(false), [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])
  return { open, show, close }
}
