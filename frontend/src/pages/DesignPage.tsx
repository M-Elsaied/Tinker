import { PageHeader } from '@/components/layout/PageHeader'
import { AugmentToolbar } from '@/components/design/AugmentToolbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { useProjectStore } from '@/stores/projectStore'
import { fmt } from '@/lib/utils'
import { RequireProject } from '@/components/layout/RequireProject'

export function DesignPage() {
  return (
    <RequireProject illustration="table" title="Open an experiment to view the design">
      <DesignInner />
    </RequireProject>
  )
}

function DesignInner() {
  const project = useProjectStore((s) => s.project)!
  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        description="Design overview, factor settings, and full run sheet."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Design</CardTitle>
            <CardDescription className="text-xs">
              {project.designType.replace(/_/g, ' ')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">{project.designRows.length} runs</Badge>
              <Badge variant="muted">{project.factors.length} factors</Badge>
              <Badge variant="muted">
                {project.designRows.filter((r) => r.point_type === 'center').length} center pts
              </Badge>
              {Object.entries(project.designInfo).map(([k, v]) => (
                <Badge key={k} variant="outline">
                  {k.replace(/_/g, ' ')}: {String(v)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Code</TH>
                  <TH>Name</TH>
                  <TH className="text-right">Low</TH>
                  <TH className="text-right">High</TH>
                  <TH>Units</TH>
                </TR>
              </THead>
              <TBody>
                {project.factors.map((f, i) => (
                  <TR key={i}>
                    <TD className="mono">{String.fromCharCode(65 + i)}</TD>
                    <TD className="font-medium">{f.name}</TD>
                    <TD className="text-right mono">{fmt(f.low, 4)}</TD>
                    <TD className="text-right mono">{fmt(f.high, 4)}</TD>
                    <TD className="mono text-muted-foreground">{f.units || '—'}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AugmentToolbar />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Run sheet</CardTitle>
          <CardDescription className="text-xs">
            Run order is randomized. Std order is the design generation order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border max-h-[60vh] overflow-auto scroll-thin">
            <Table>
              <THead className="sticky top-0 bg-card z-10">
                <TR>
                  <TH className="text-center w-12">Run</TH>
                  <TH className="text-center w-16">Std</TH>
                  <TH className="text-center w-20">Type</TH>
                  {project.factors.map((f) => (
                    <TH key={f.name} className="text-right mono">
                      {f.name}
                    </TH>
                  ))}
                </TR>
              </THead>
              <TBody>
                {project.designRows.map((row) => (
                  <TR key={row.run}>
                    <TD className="mono text-center">{row.run}</TD>
                    <TD className="mono text-center text-muted-foreground">{row.std_order}</TD>
                    <TD className="text-center">
                      <Badge variant={row.point_type === 'center' ? 'success' : 'muted'}>
                        {row.point_type}
                      </Badge>
                    </TD>
                    {row.actual.map((v, i) => (
                      <TD key={i} className="text-right mono">{fmt(v, 4)}</TD>
                    ))}
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
