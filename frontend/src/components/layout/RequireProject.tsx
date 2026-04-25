import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Beaker, Plus } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useProjectStore } from '@/stores/projectStore'

interface Props {
  children?: ReactNode
  /** Optional override: title shown when no project. */
  title?: string
  description?: string
  illustration?: 'beaker' | 'chart' | 'table' | 'sliders' | 'sparkles'
}

/** Wrap any page that requires a loaded project. Renders a friendly EmptyState otherwise. */
export function RequireProject({
  children,
  title = 'No experiment open',
  description = 'Open one of the worked examples or start a new design from the wizard.',
  illustration = 'beaker',
}: Props) {
  const project = useProjectStore((s) => s.project)
  const navigate = useNavigate()
  if (!project) {
    return (
      <EmptyState
        title={title}
        description={description}
        illustration={illustration}
        primaryAction={{
          label: 'Browse examples',
          icon: <Beaker className="h-3.5 w-3.5" />,
          onClick: () => navigate('/'),
        }}
        secondaryAction={{
          label: 'New design',
          icon: <Plus className="h-3.5 w-3.5" />,
          onClick: () => navigate('/new'),
        }}
      />
    )
  }
  return <>{children ?? null}</>
}
