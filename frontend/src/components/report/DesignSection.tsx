import { ReportPageBlock, ReportSubBlock } from './ReportShell'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { fmt } from '@/lib/utils'
import type { Project } from '@/types'

export function DesignSection({ project }: { project: Project }) {
  return (
    <ReportPageBlock id="design">
      <h2 className="report-h2">Design</h2>

      <ReportSubBlock>
        <h3 className="report-h3">Factors</h3>
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
                <TD className="text-muted-foreground">{f.units || '—'}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </ReportSubBlock>

      <ReportSubBlock>
        <h3 className="report-h3">Run sheet (run-order randomized)</h3>
        <Table>
          <THead>
            <TR>
              <TH className="text-center w-12">Run</TH>
              <TH className="text-center w-16">Std</TH>
              <TH className="text-center w-20">Type</TH>
              {project.factors.map((f) => (
                <TH key={f.name} className="text-right mono">{f.name}</TH>
              ))}
            </TR>
          </THead>
          <TBody>
            {project.designRows.map((row) => (
              <TR key={row.run}>
                <TD className="mono text-center">{row.run}</TD>
                <TD className="mono text-center text-muted-foreground">{row.std_order}</TD>
                <TD className="text-center">
                  <Badge variant={row.point_type === 'center' ? 'success' : 'muted'}>{row.point_type}</Badge>
                </TD>
                {row.actual.map((v, i) => (
                  <TD key={i} className="text-right mono">{fmt(v, 4)}</TD>
                ))}
              </TR>
            ))}
          </TBody>
        </Table>
      </ReportSubBlock>
    </ReportPageBlock>
  )
}
