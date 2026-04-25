import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { Search } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { useTheme } from '@/hooks/useTheme'
import { KeyboardHint } from '@/components/ui/keyboard-hint'
import { buildCommands, type Command as Cmd } from './commands'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.project)
  const setProject = useProjectStore((s) => s.setProject)
  const { setChoice, toggle } = useTheme()

  // ⌘K listener
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const commands: Cmd[] = useMemo(
    () => buildCommands({
      navigate, project, setProject,
      setTheme: setChoice, toggleTheme: toggle,
      closePalette: () => setOpen(false),
    }),
    [navigate, project, setProject, setChoice, toggle],
  )

  if (!open) return null

  // Group commands
  const groups = commands.reduce<Record<string, Cmd[]>>((acc, c) => {
    (acc[c.group] ??= []).push(c); return acc
  }, {})

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-start pt-[15vh] bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-150"
      onClick={() => setOpen(false)}
    >
      <Command
        label="Command palette"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg mx-auto rounded-xl border border-border-soft bg-card text-card-foreground shadow-token-lg overflow-hidden"
      >
        <div className="flex items-center gap-2 border-b border-border-soft px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Command.Input
            autoFocus
            placeholder="Search actions, examples, navigate..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          <KeyboardHint keys={['esc']} className="text-[10px] text-muted-foreground" />
        </div>
        <Command.List className="max-h-[420px] overflow-auto scroll-thin p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            No matching commands.
          </Command.Empty>
          {Object.entries(groups).map(([group, items]) => (
            <Command.Group key={group} heading={group} className="mb-1 [&_[cmdk-group-heading]]:text-eyebrow [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              {items.map((cmd) => (
                <Command.Item
                  key={cmd.id}
                  value={`${cmd.label} ${(cmd.keywords ?? []).join(' ')}`}
                  onSelect={() => cmd.perform()}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <span className="text-muted-foreground">{cmd.icon}</span>
                  <span className="flex-1">{cmd.label}</span>
                  {cmd.shortcut && <KeyboardHint keys={cmd.shortcut} className="text-[10px]" />}
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command>
    </div>
  )
}
