import { Fragment, useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TreeNode {
  id: string
  label: string
  icon?: ReactNode
  badge?: ReactNode
  href?: string
  defaultOpen?: boolean
  /** Indentation depth (0 = top group, 1 = leaf, 2 = sub-leaf). */
  children?: TreeNode[]
}

interface Props {
  nodes: TreeNode[]
  activePath: string
  onSelect: (id: string) => void
}

export function HierarchicalTree({ nodes, activePath, onSelect }: Props) {
  return (
    <div className="space-y-0.5 py-1">
      {nodes.map((node) => (
        <TreeBranch key={node.id} node={node} depth={0} activePath={activePath} onSelect={onSelect} />
      ))}
    </div>
  )
}

function TreeBranch({
  node,
  depth,
  activePath,
  onSelect,
}: {
  node: TreeNode
  depth: number
  activePath: string
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(node.defaultOpen ?? depth === 0)
  const hasChildren = node.children && node.children.length > 0
  const isActive = activePath === node.id

  const handleClick = () => {
    if (hasChildren) setOpen((o) => !o)
    if (node.href || !hasChildren) onSelect(node.id)
  }

  return (
    <Fragment>
      <button
        onClick={handleClick}
        className={cn(
          'group flex w-full items-center gap-1.5 rounded-md text-left text-[13px] transition-colors',
          depth === 0 && 'mt-2 mb-0.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground',
          depth === 1 && 'px-2 py-1.5 hover:bg-accent',
          depth >= 2 && 'pl-8 pr-2 py-1 hover:bg-accent text-[12.5px]',
          isActive && depth >= 1 && 'bg-accent text-accent-foreground font-medium',
        )}
      >
        {hasChildren && depth > 0 && (
          <ChevronRight
            className={cn('h-3 w-3 shrink-0 transition-transform text-muted-foreground', open && 'rotate-90')}
          />
        )}
        {node.icon && depth >= 1 && (
          <span className={cn('shrink-0 text-muted-foreground', isActive && 'text-foreground')}>
            {node.icon}
          </span>
        )}
        <span className="flex-1 truncate">{node.label}</span>
        {node.badge && <span className="ml-auto shrink-0">{node.badge}</span>}
      </button>
      {hasChildren && open && (
        <div className="ml-0">
          {node.children!.map((child) => (
            <TreeBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              activePath={activePath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </Fragment>
  )
}
