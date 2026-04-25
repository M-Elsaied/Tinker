import { useCallback, useEffect, useState } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'doe-lab-theme'

function resolve(choice: ThemeChoice): ResolvedTheme {
  if (choice === 'system') {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return choice
}

function apply(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.dataset.theme = resolved
  // notify listeners (Plotly re-themes via this event)
  window.dispatchEvent(new CustomEvent('theme:change', { detail: { resolved } }))
}

function read(): ThemeChoice {
  if (typeof window === 'undefined') return 'system'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

let initialized = false
function initOnce() {
  if (initialized) return
  initialized = true
  const choice = read()
  apply(resolve(choice))
}

export function useTheme(): {
  choice: ThemeChoice
  resolved: ResolvedTheme
  setChoice: (c: ThemeChoice) => void
  toggle: () => void
} {
  initOnce()
  const [choice, setChoiceState] = useState<ThemeChoice>(() => read())
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolve(read()))

  const setChoice = useCallback((c: ThemeChoice) => {
    window.localStorage.setItem(STORAGE_KEY, c)
    setChoiceState(c)
    const r = resolve(c)
    setResolved(r)
    apply(r)
  }, [])

  const toggle = useCallback(() => {
    setChoice(resolved === 'dark' ? 'light' : 'dark')
  }, [resolved, setChoice])

  // Track system preference if user picked 'system'
  useEffect(() => {
    if (choice !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const r = mq.matches ? 'dark' : 'light'
      setResolved(r)
      apply(r)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [choice])

  return { choice, resolved, setChoice, toggle }
}
