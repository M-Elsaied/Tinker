import { useCallback, useEffect, useState } from 'react'

export type Density = 'comfortable' | 'compact'

const STORAGE_KEY = 'doe-lab-density'

function read(): Density {
  if (typeof window === 'undefined') return 'comfortable'
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === 'compact' ? 'compact' : 'comfortable'
}

function apply(d: Density) {
  document.documentElement.dataset.density = d
}

let initialized = false
function init() { if (!initialized) { initialized = true; apply(read()) } }

export function useDensity(): { density: Density; setDensity: (d: Density) => void } {
  init()
  const [density, setDensityState] = useState<Density>(read())
  const setDensity = useCallback((d: Density) => {
    window.localStorage.setItem(STORAGE_KEY, d)
    setDensityState(d)
    apply(d)
  }, [])
  useEffect(() => { apply(density) }, [density])
  return { density, setDensity }
}
