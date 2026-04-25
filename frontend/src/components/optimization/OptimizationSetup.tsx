import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import type { GoalType, ResponseGoalConfig } from '@/types'

const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
  { value: 'none', label: 'none' },
  { value: 'minimize', label: 'minimize' },
  { value: 'maximize', label: 'maximize' },
  { value: 'target', label: 'target' },
  { value: 'in_range', label: 'in range' },
]

export function OptimizationSetup({
  goals,
  onChange,
}: {
  goals: ResponseGoalConfig[]
  onChange: (g: ResponseGoalConfig[]) => void
}) {
  const update = (idx: number, patch: Partial<ResponseGoalConfig>) => {
    onChange(goals.map((g, i) => (i === idx ? { ...g, ...patch } : g)))
  }
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <THead>
          <TR>
            <TH>Response</TH>
            <TH className="w-32">Goal</TH>
            <TH className="text-right w-24">Lower</TH>
            <TH className="text-right w-24">Target</TH>
            <TH className="text-right w-24">Upper</TH>
            <TH className="text-right w-20">Weight</TH>
            <TH className="text-right w-24">Importance</TH>
          </TR>
        </THead>
        <TBody>
          {goals.map((g, i) => (
            <TR key={i}>
              <TD className="font-medium">{g.name}</TD>
              <TD>
                <Select
                  value={g.goal}
                  onChange={(e) => update(i, { goal: e.target.value as GoalType })}
                >
                  {GOAL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </TD>
              <TD>
                <Input
                  type="number"
                  className="text-right mono"
                  value={g.lower}
                  onChange={(e) => update(i, { lower: Number(e.target.value) })}
                />
              </TD>
              <TD>
                <Input
                  type="number"
                  className="text-right mono"
                  value={g.target ?? ''}
                  placeholder="—"
                  onChange={(e) =>
                    update(i, {
                      target: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
              </TD>
              <TD>
                <Input
                  type="number"
                  className="text-right mono"
                  value={g.upper}
                  onChange={(e) => update(i, { upper: Number(e.target.value) })}
                />
              </TD>
              <TD>
                <Input
                  type="number"
                  step="0.1"
                  min={0.1}
                  max={10}
                  className="text-right mono"
                  value={g.weight}
                  onChange={(e) => update(i, { weight: Number(e.target.value) })}
                />
              </TD>
              <TD>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  className="text-right mono"
                  value={g.importance}
                  onChange={(e) => update(i, { importance: Number(e.target.value) })}
                />
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
      <div className="bg-muted/30 px-4 py-2 text-xs text-muted-foreground space-y-1">
        <div><Label className="text-xs">Weight</Label> shapes the desirability curve (1 = linear). Higher weight = stricter penalty for missing the goal.</div>
        <div><Label className="text-xs">Importance</Label> 1–5 sets relative emphasis between responses in the composite desirability.</div>
      </div>
    </div>
  )
}
