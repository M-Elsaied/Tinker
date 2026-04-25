import { PageHeader } from '@/components/layout/PageHeader'
import { DataGrid } from '@/components/data/DataGrid'
import { ImportExport } from '@/components/data/ImportExport'
import { ExampleBanner } from '@/components/examples/ExampleBanner'
import { RequireProject } from '@/components/layout/RequireProject'

export function DataPage() {
  return (
    <RequireProject
      title="No data to enter yet"
      description="Open an experiment first, then come back here to enter response measurements."
      illustration="table"
    >
      <div className="space-y-4">
        <PageHeader
          title="Data entry"
          description="Enter measured response values for each run. Paste from Excel is supported."
          actions={<ImportExport />}
        />
        <ExampleBanner />
        <DataGrid />
      </div>
    </RequireProject>
  )
}
