import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { CommandPalette } from '@/components/command/CommandPalette'
import { ShortcutOverlay } from '@/components/command/ShortcutOverlay'
import { useShortcuts, useShortcutOverlay } from '@/hooks/useShortcuts'

export function AppShell({ children }: { children: ReactNode }) {
  const overlay = useShortcutOverlay()
  useShortcuts({ showOverlay: overlay.show })
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">{children}</main>
      <CommandPalette />
      <ShortcutOverlay open={overlay.open} onClose={overlay.close} />
    </div>
  )
}
