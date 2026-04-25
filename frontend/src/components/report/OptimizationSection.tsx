import { ReportPageBlock, ReportSubBlock } from './ReportShell'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RampBar } from '@/components/optimization/RampBar'
import { fmt } from '@/lib/utils'
import type { OptimizationResponse, Project, ResponseGoalConfig } from '@/types'

export function OptimizationSection({
  project, optimization, goals,
}: {
  project: Project
  optimization: OptimizationResponse
  goals: ResponseGoalConfig[]
}) {
  if (!optimization || optimization.solutions.length === 0) {
    return (
      <ReportPageBlock id="optimization">
        <h2 className="report-h2">Optimization</h2>
        <p className="report-prose text-muted-foreground">No feasible optimization solutions were found. Loosen the goals or refit the models.</p>
      </ReportPageBlock>
    )
  }

  const top = optimization.solutions.slice(0, 3)
  const factorNames = project.factors.map((f) => f.name)
  const responseNames = project.responses.map((r) => r.name)

  return (
    <ReportPageBlock id="optimization">
      <h2 className="report-h2">Optimization</h2>

      <ReportSubBlock>
        <h3 className="report-h3">Goals</h3>
        <Table>
          <THead>
            <TR>
              <TH>Response</TH>
              <TH>Goal</TH>
              <TH className="text-right">Lower</TH>
              <TH className="text-right">Target</TH>
              <TH className="text-right">Upper</TH>
              <TH className="text-right">Importance</TH>
            </TR>
          </THead>
          <TBody>
            {goals.map((g) => (
              <TR key={g.name}>
                <TD>{g.name}</TD>
                <TD><Badge variant="muted">{g.goal}</Badge></TD>
                <TD className="text-right mono">{fmt(g.lower, 3)}</TD>
                <TD className="text-right mono">{g.target == null ? '—' : fmt(g.target, 3)}</TD>
                <TD className="text-right mono">{fmt(g.upper, 3)}</TD>
                <TD className="text-right mono">{g.importance}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </ReportSubBlock>

      <ReportSubBlock>
        <h3 className="report-h3">Top solutions</h3>
        <Table>
          <THead>
            <TR>
              <TH className="w-10">#</TH>
              {factorNames.map((n) => <TH key={n} className="text-right mono">{n}</TH>)}
              {responseNames.map((n) => <TH key={n} className="text-right mono bg-primary/5">{n}</TH>)}
              <TH className="text-right">D</TH>
            </TR>
          </THead>
          <TBody>
            {top.map((s, i) => (
              <TR key={i} className={i === 0 ? 'bg-sig-muted/30' : ''}>
                <TD className="mono">{i + 1}</TD>
                {factorNames.map((n) => <TD key={n} className="text-right mono">{fmt(s.factors[n], 4)}</TD>)}
                {responseNames.map((n) => <TD key={n} className="text-right mono bg-primary/5">{fmt(s.responses[n], 4)}</TD>)}
                <TD className="text-right mono font-semibold">{s.composite_desirability.toFixed(4)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </ReportSubBlock>

      <ReportSubBlock>
        <h3 className="report-h3">Best-solution desirability ramps</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {goals.map((g) => {
            const predicted = top[0].responses[g.name]
            const d = top[0].individual_desirabilities?.[g.name] ?? 0
            if (predicted === undefined) return null
            const respUnits = project.responses.find((r) => r.name === g.name)?.units
            return (
              <RampBar
                key={g.name}
                name={g.name}
                goal={g.goal}
                lower={g.lower}
                upper={g.upper}
                target={g.target}
                predicted={predicted}
                desirability={d}
                units={respUnits}
              />
            )
          })}
        </div>
      </ReportSubBlock>
    </ReportPageBlock>
  )
}
