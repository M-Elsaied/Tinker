import { X } from 'lucide-react'
import { KeyboardHint } from '@/components/ui/keyboard-hint'

interface ShortcutSection {
  label: string
  rows: { keys: string[]; desc: string }[]
}

const SECTIONS: ShortcutSection[] = [
  {
    label: 'Navigation',
    rows: [
      { keys: ['mod', 'k'], desc: 'Open command palette' },
      { keys: ['g', 'h'], desc: 'Go to Home' },
      { keys: ['g', 'n'], desc: 'New design' },
      { keys: ['g', 'd'], desc: 'Design overview' },
      { keys: ['g', 'a'], desc: 'Analysis' },
      { keys: ['g', 'o'], desc: 'Optimization' },
      { keys: ['g', 'p'], desc: 'Profiler' },
      { keys: ['g', 'c'], desc: 'Confirmation' },
      { keys: ['g', 'e'], desc: 'Evaluation' },
      { keys: ['g', 'r'], desc: 'Report' },
    ],
  },
  {
    label: 'View',
    rows: [
      { keys: ['mod', '/'], desc: 'Toggle dark / light theme' },
      { keys: ['mod', 'p'], desc: 'Print current page' },
      { keys: ['mod', 'shift', 'e'], desc: 'Export report PDF' },
      { keys: ['?'], desc: 'Show this help' },
      { keys: ['esc'], desc: 'Close palettes / dialogs' },
    ],
  },
]

export function ShortcutOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-border-soft bg-card text-card-foreground shadow-token-lg overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
          <div className="text-sm font-semibold">Keyboard shortcuts</div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-auto scroll-thin p-4 space-y-4">
          {SECTIONS.map((s) => (
            <div key={s.label}>
              <div className="text-eyebrow mb-2">{s.label}</div>
              <div className="space-y-1">
                {s.rows.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-[12.5px] py-1">
                    <span>{r.desc}</span>
                    <KeyboardHint keys={r.keys} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
