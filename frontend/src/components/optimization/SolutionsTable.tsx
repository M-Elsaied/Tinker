import { useMemo } from 'react'
import { Star } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { GlossaryTerm } from '@/components/ui/glossary-term'
import type { ColumnDef } from '@tanstack/react-table'
import { fmt } from '@/lib/utils'
import type { OptimizationSolution } from '@/types'

interface Row { idx: number; sol: OptimizationSolution }

export function SolutionsTable({
  solutions, factorNames, responseNames,
}: {
  solutions: OptimizationSolution[]
  factorNames: string[]
  responseNames: string[]
}) {
  const data: Row[] = useMemo(
    () => solutions.map((sol, idx) => ({ idx, sol })),
    [solutions],
  )

  const columns: ColumnDef<Row, any>[] = useMemo(() => {
    const cols: ColumnDef<Row, any>[] = [
      {
        id: 'rank',
        header: '#',
        accessorFn: (r) => r.idx + 1,
        cell: ({ row }) => (
          <span className="mono inline-flex items-center gap-1">
            {row.original.idx === 0 && <Star className="h-3 w-3 fill-[hsl(var(--de-significant))] text-[hsl(var(--de-significant))]" />}
            {row.original.idx + 1}
          </span>
        ),
      },
    ]
    for (const name of factorNames) {
      cols.push({
        id: `f-${name}`,
        header: name,
        accessorFn: (r) => r.sol.factors[name],
        cell: ({ getValue }) => <span className="mono tabular-nums">{fmt(getValue() as number, 4)}</span>,
        meta: { align: 'right' },
      })
    }
    for (const name of responseNames) {
      cols.push({
        id: `r-${name}`,
        header: name,
        accessorFn: (r) => r.sol.responses[name],
        cell: ({ getValue }) => <span className="mono tabular-nums">{fmt(getValue() as number, 4)}</span>,
        meta: { align: 'right' },
      })
    }
    cols.push({
      id: 'D',
      header: () => <GlossaryTerm term="desirability">D</GlossaryTerm>,
      accessorFn: (r) => r.sol.composite_desirability,
      cell: ({ getValue }) => {
        const v = getValue() as number
        const tone = v >= 0.8 ? 'success' : v >= 0.5 ? 'muted' : 'default'
        return (
          <Badge variant={tone === 'default' ? 'default' : tone}>
            <span className="mono">{v.toFixed(4)}</span>
          </Badge>
        )
      },
      meta: { align: 'right' },
    })
    return cols
  }, [factorNames, responseNames])

  if (solutions.length === 0) {
    return (
      <div className="rounded-lg border border-border-soft bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        No feasible solutions found. Loosen your goals or check that the model fits the data.
      </div>
    )
  }

  return (
    <DataTable<Row>
      data={data}
      columns={columns}
      sortable
      stickyHeader
      persistKey="solutions"
      defaultSorting={[{ id: 'D', desc: true }]}
      rowClassName={(row) => row.original.idx === 0 ? 'bg-sig-muted/20' : undefined}
    />
  )
}
