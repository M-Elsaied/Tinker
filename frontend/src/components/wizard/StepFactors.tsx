import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Factor } from '@/types'

const NAMES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function StepFactors({
  factors,
  setFactors,
  responseNames,
  setResponseNames,
}: {
  factors: Factor[]
  setFactors: (f: Factor[]) => void
  responseNames: string[]
  setResponseNames: (r: string[]) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Input factors</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const next = NAMES[factors.length] || `X${factors.length + 1}`
              setFactors([
                ...factors,
                { name: next, low: -1, high: 1, units: '' },
              ])
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add factor
          </Button>
        </div>
        <div className="rounded-lg border bg-muted/20 overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_120px_120px_140px_40px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/40">
            <div>#</div>
            <div>Name</div>
            <div>Low</div>
            <div>High</div>
            <div>Units</div>
            <div></div>
          </div>
          {factors.map((f, i) => {
            const nameError = !f.name.trim() ? 'Required' : ''
            const rangeError = f.high <= f.low ? 'Low must be < High' : ''
            return (
              <div
                key={i}
                className="grid grid-cols-[40px_1fr_140px_140px_140px_40px] gap-2 px-3 py-2 items-start border-b border-border-soft last:border-0"
              >
                <div className="mono text-xs text-muted-foreground pt-2">
                  {NAMES[i] || `X${i + 1}`}
                </div>
                <Input
                  value={f.name}
                  error={nameError || undefined}
                  onChange={(e) =>
                    setFactors(
                      factors.map((g, j) => (j === i ? { ...g, name: e.target.value } : g)),
                    )
                  }
                  placeholder="Temperature"
                />
                <Input
                  type="number"
                  value={f.low}
                  error={rangeError || undefined}
                  onChange={(e) =>
                    setFactors(
                      factors.map((g, j) =>
                        j === i ? { ...g, low: Number(e.target.value) } : g,
                      ),
                    )
                  }
                />
                <Input
                  type="number"
                  value={f.high}
                  error={rangeError ? ' ' : undefined}
                  onChange={(e) =>
                    setFactors(
                      factors.map((g, j) =>
                        j === i ? { ...g, high: Number(e.target.value) } : g,
                      ),
                    )
                  }
                />
                <Input
                  value={f.units}
                  hint={i === 0 ? 'optional' : undefined}
                  onChange={(e) =>
                    setFactors(
                      factors.map((g, j) => (j === i ? { ...g, units: e.target.value } : g)),
                    )
                  }
                  placeholder="°C"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={factors.length <= 2}
                  className="mt-0.5"
                  onClick={() => setFactors(factors.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Need at least 2 factors. Box-Behnken requires 3+.
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Responses</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setResponseNames([...responseNames, `Response ${responseNames.length + 1}`])
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Add response
          </Button>
        </div>
        <div className="rounded-lg border bg-muted/20 overflow-hidden">
          {responseNames.map((rn, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 border-b last:border-0"
            >
              <Input
                value={rn}
                onChange={(e) =>
                  setResponseNames(responseNames.map((r, j) => (j === i ? e.target.value : r)))
                }
                placeholder="Yield"
              />
              <Button
                size="icon"
                variant="ghost"
                disabled={responseNames.length <= 1}
                onClick={() => setResponseNames(responseNames.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
