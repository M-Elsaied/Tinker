import { useMemo } from 'react'
import { cn } from '@/lib/utils'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)

const KEY_LABEL: Record<string, string> = {
  mod: isMac ? '⌘' : 'Ctrl',
  cmd: '⌘',
  ctrl: 'Ctrl',
  shift: '⇧',
  alt: isMac ? '⌥' : 'Alt',
  enter: '↵',
  esc: 'Esc',
  tab: 'Tab',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
}

interface Props {
  keys: string[]
  className?: string
}

export function KeyboardHint({ keys, className }: Props) {
  const labels = useMemo(() => keys.map((k) => KEY_LABEL[k.toLowerCase()] ?? k.toUpperCase()), [keys])
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {labels.map((l, i) => (
        <kbd key={i}>{l}</kbd>
      ))}
    </span>
  )
}
