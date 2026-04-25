import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { fmt } from '@/lib/utils'
import type { Factor, GenerateDesignResponse } from '@/types'

export function StepReview({
  preview,
  generating,
  error,
  factors,
  onGenerate,
}: {
  preview: GenerateDesignResponse | null
  generating: boolean
  error: string | null
  factors: Factor[]
  onGenerate: () => void
}) {
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <div className="font-medium text-destructive">Generation failed</div>
          <div className="text-sm text-muted-foreground mt-0.5">{error}</div>
          <Button onClick={onGenerate} variant="outline" size="sm" className="mt-3">
            Try again
          </Button>
        </div>
      </div>
    )
  }
  if (!preview) {
    if (generating) {
      return (
        <div className="grid place-items-center rounded-lg border bg-muted/20 p-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Building design matrix...
          </div>
        </div>
      )
    }
    return (
      <div className="grid place-items-center rounded-lg border bg-muted/20 p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Click <span className="font-medium text-foreground">Generate</span> to build the
          design matrix.
        </p>
      </div>
    )
  }

  const infoEntries = Object.entries(preview.info || {})

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success">{preview.n_runs} runs</Badge>
        {infoEntries.map(([k, v]) => (
          <Badge key={k} variant="muted">
            {k.replace(/_/g, ' ')}: <span className="ml-1 mono">{String(v)}</span>
          </Badge>
        ))}
      </div>
      <div className="rounded-lg border max-h-96 overflow-auto scroll-thin">
        <Table>
          <THead>
            <TR>
              <TH className="w-12">Run</TH>
              <TH className="w-16">Std</TH>
              <TH className="w-20">Type</TH>
              {factors.map((f) => (
                <TH key={f.name} className="text-right mono">
                  {f.name}
                  {f.units && <span className="ml-1 text-muted-foreground">({f.units})</span>}
                </TH>
              ))}
            </TR>
          </THead>
          <TBody>
            {preview.rows.map((row) => (
              <TR key={row.run}>
                <TD className="mono">{row.run}</TD>
                <TD className="mono text-muted-foreground">{row.std_order}</TD>
                <TD>
                  <Badge variant={row.point_type === 'center' ? 'success' : 'muted'}>
                    {row.point_type}
                  </Badge>
                </TD>
                {row.actual.map((v, i) => (
                  <TD key={i} className="text-right mono">
                    {fmt(v, 4)}
                  </TD>
                ))}
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  )
}
