import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { useProjectStore } from '@/stores/projectStore'
import { fmt } from '@/lib/utils'

export function DataGrid() {
  const project = useProjectStore((s) => s.project)
  const update = useProjectStore((s) => s.updateResponseValue)
  const addResponse = useProjectStore((s) => s.addResponse)
  const removeResponse = useProjectStore((s) => s.removeResponse)
  const renameResponse = useProjectStore((s) => s.renameResponse)
  const persist = useProjectStore((s) => s.persist)
  const [showCoded, setShowCoded] = useState(false)

  const factors = project?.factors ?? []
  const rows = project?.designRows ?? []
  const responses = project?.responses ?? []

  const totals = useMemo(() => {
    return responses.map((r) => {
      const filled = r.data.filter((v) => v !== null && v !== undefined && !Number.isNaN(v)).length
      return { filled, total: r.data.length }
    })
  }, [responses])

  if (!project) return null

  const handleEdit = (resp: number, run: number, raw: string) => {
    if (raw === '') {
      update(resp, run, null)
      return
    }
    const v = Number(raw)
    update(resp, run, Number.isNaN(v) ? null : v)
  }

  const handlePaste = (e: React.ClipboardEvent, respIdx: number, startRun: number) => {
    const text = e.clipboardData.getData('text')
    if (!text.includes('\n') && !text.includes('\t')) return
    e.preventDefault()
    const lines = text.replace(/\r/g, '').split('\n').filter(Boolean)
    lines.forEach((line, k) => {
      const cells = line.split('\t')
      cells.forEach((cell, j) => {
        const targetRun = startRun + k
        const targetResp = respIdx + j
        if (targetRun < rows.length && targetResp < responses.length) {
          const v = cell.trim() === '' ? null : Number(cell)
          update(targetResp, targetRun, Number.isNaN(v as number) ? null : (v as number))
        }
      })
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showCoded}
              onChange={(e) => setShowCoded(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            Show coded units
          </label>
          <span className="text-xs text-muted-foreground">
            {rows.length} runs · {responses.length} response{responses.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => addResponse(`Response ${responses.length + 1}`)}
          >
            <Plus className="h-3.5 w-3.5" />
            Response
          </Button>
          <Button size="sm" variant="outline" onClick={() => persist()}>
            Save
          </Button>
        </div>
      </div>

      <div className="rounded-lg border overflow-auto scroll-thin max-h-[calc(100vh-220px)]">
        <Table>
          <THead className="sticky top-0 z-10 bg-card">
            <TR>
              <TH className="w-12 text-center">Run</TH>
              <TH className="w-16 text-center">Std</TH>
              {factors.map((f) => (
                <TH key={f.name} className="text-right mono bg-muted/40">
                  {f.name}
                  {f.units && (
                    <span className="ml-1 font-normal text-muted-foreground/70">
                      ({f.units})
                    </span>
                  )}
                </TH>
              ))}
              {responses.map((r, i) => (
                <TH key={i} className="bg-primary/5">
                  <div className="flex items-center gap-1">
                    <Input
                      className="h-6 w-32 text-xs"
                      value={r.name}
                      onChange={(e) => renameResponse(i, e.target.value)}
                    />
                    {responses.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => removeResponse(i)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="text-[10px] font-normal text-muted-foreground mt-0.5">
                    {totals[i]?.filled}/{totals[i]?.total} filled
                  </div>
                </TH>
              ))}
            </TR>
          </THead>
          <TBody>
            {rows.map((row, i) => (
              <TR key={row.run}>
                <TD className="mono text-center">{row.run}</TD>
                <TD className="mono text-center text-muted-foreground">{row.std_order}</TD>
                {(showCoded ? row.coded : row.actual).map((v, j) => (
                  <TD key={j} className="text-right mono bg-muted/10 text-foreground/70">
                    {fmt(v, 4)}
                  </TD>
                ))}
                {responses.map((r, j) => (
                  <TD key={j} className="bg-primary/5 p-1">
                    <input
                      className="w-full bg-transparent text-right mono text-sm outline-none focus:bg-background focus:ring-2 focus:ring-primary/40 rounded px-2 py-1"
                      value={r.data[i] ?? ''}
                      onChange={(e) => handleEdit(j, i, e.target.value)}
                      onPaste={(e) => handlePaste(e, j, i)}
                      placeholder="—"
                      type="text"
                      inputMode="decimal"
                    />
                  </TD>
                ))}
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: Copy a column from Excel and paste into a response cell — multi-row, multi-column
        paste is supported.
      </p>
    </div>
  )
}
