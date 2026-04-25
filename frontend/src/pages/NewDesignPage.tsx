import { PageHeader } from '@/components/layout/PageHeader'
import { DesignWizard } from '@/components/wizard/DesignWizard'

export function NewDesignPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="New design"
        description="Walk through the four steps to build a randomized experiment."
      />
      <DesignWizard />
    </div>
  )
}
