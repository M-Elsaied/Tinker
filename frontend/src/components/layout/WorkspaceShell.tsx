import { type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

interface Props {
  topTabs?: ReactNode
  toolbar?: ReactNode
  paneArea: ReactNode
  rightDrawer?: ReactNode
}

export function WorkspaceShell({ topTabs, toolbar, paneArea, rightDrawer }: Props) {
  const reduce = useReducedMotion()
  return (
    <div className="flex h-full flex-col">
      {topTabs}
      {toolbar && (
        <div className="flex items-center gap-2 border-b border-border-soft bg-card/60 px-3 py-1.5">{toolbar}</div>
      )}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 p-2">{paneArea}</div>
        <AnimatePresence initial={false} mode="wait">
          {rightDrawer && (
            <motion.aside
              key="drawer"
              className="w-72 shrink-0 border-l border-border-soft bg-card overflow-auto scroll-thin"
              initial={reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: 16 }}
              transition={{ duration: reduce ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {rightDrawer}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
