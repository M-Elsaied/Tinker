import { ReportPageBlock } from './ReportShell'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { fmt } from '@/lib/utils'
import type { Project } from '@/types'

export function DataSection({ project }: { project: Project }) {
  return (
    <ReportPageBlock id="data">
      <h2 className="report-h2">Observed Data</h2>
      <Table>
        <THead>
          <TR>
            <TH className="text-center w-12">Run</TH>
            {project.factors.map((f) => (
              <TH key={f.name} className="text-right mono">{f.name}</TH>
            ))}
            {project.responses.map((r) => (
              <TH key={r.name} className="text-right mono bg-primary/5">
                {r.name}{r.units && <span className="text-muted-foreground"> ({r.units})</span>}
              </TH>
            ))}
          </TR>
        </THead>
        <TBody>
          {project.designRows.map((row, i) => (
            <TR key={row.run}>
              <TD className="mono text-center">{row.run}</TD>
              {row.actual.map((v, j) => (
                <TD key={j} className="text-right mono">{fmt(v, 4)}</TD>
              ))}
              {project.responses.map((r) => (
                <TD key={r.name} className="text-right mono bg-primary/5">
                  {r.data[i] === null || r.data[i] === undefined ? '—' : fmt(r.data[i] as number, 4)}
                </TD>
              ))}
            </TR>
          ))}
        </TBody>
      </Table>
    </ReportPageBlock>
  )
}
