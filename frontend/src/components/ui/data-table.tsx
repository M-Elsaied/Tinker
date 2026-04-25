import { useEffect, useState, type ReactNode } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type Row,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Table, TBody, TD, TH, THead, TR } from './table'
import { cn } from '@/lib/utils'

interface Props<T> {
  columns: ColumnDef<T, any>[]
  data: T[]
  /** When true, the header sticks to the top of the scroll container. */
  stickyHeader?: boolean
  /** When true, columns can be sorted by clicking their header. */
  sortable?: boolean
  /** Optional default sort. */
  defaultSorting?: SortingState
  /** Highlight whole row className based on row data. */
  rowClassName?: (row: Row<T>) => string | undefined
  /** Persist sorting under this storage key. */
  persistKey?: string
}

export function DataTable<T>({
  columns, data, stickyHeader, sortable, defaultSorting, rowClassName, persistKey,
}: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>(() => {
    if (!persistKey) return defaultSorting ?? []
    try {
      const raw = window.localStorage.getItem(`doe-table-sort:${persistKey}`)
      if (raw) return JSON.parse(raw)
    } catch { /* noop */ }
    return defaultSorting ?? []
  })

  useEffect(() => {
    if (!persistKey) return
    try {
      window.localStorage.setItem(`doe-table-sort:${persistKey}`, JSON.stringify(sorting))
    } catch { /* noop */ }
  }, [sorting, persistKey])

  const table = useReactTable({
    data, columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: sortable ? getSortedRowModel() : undefined,
    enableSorting: !!sortable,
  })

  return (
    <Table>
      <THead className={cn(stickyHeader && 'sticky top-0 z-10 bg-card backdrop-blur-sm')}>
        {table.getHeaderGroups().map((hg) => (
          <TR key={hg.id}>
            {hg.headers.map((h) => {
              const canSort = sortable && h.column.getCanSort()
              const sortState = h.column.getIsSorted()
              const align = (h.column.columnDef.meta as any)?.align ?? 'left'
              return (
                <TH
                  key={h.id}
                  className={cn(
                    align === 'right' && 'text-right',
                    align === 'center' && 'text-center',
                    canSort && 'cursor-pointer select-none hover:text-foreground transition-colors',
                  )}
                  onClick={canSort ? h.column.getToggleSortingHandler() : undefined}
                >
                  <span className={cn('inline-flex items-center gap-1', align === 'right' && 'justify-end')}>
                    {flexRender(h.column.columnDef.header, h.getContext()) as ReactNode}
                    {canSort && (
                      sortState === 'asc' ? <ArrowUp className="h-3 w-3" />
                        : sortState === 'desc' ? <ArrowDown className="h-3 w-3" />
                        : <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </span>
                </TH>
              )
            })}
          </TR>
        ))}
      </THead>
      <TBody>
        {table.getRowModel().rows.map((row) => {
          const extraClass = rowClassName?.(row)
          return (
            <TR key={row.id} className={extraClass}>
              {row.getVisibleCells().map((cell) => {
                const align = (cell.column.columnDef.meta as any)?.align ?? 'left'
                return (
                  <TD
                    key={cell.id}
                    className={cn(
                      align === 'right' && 'text-right',
                      align === 'center' && 'text-center',
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext()) as ReactNode}
                  </TD>
                )
              })}
            </TR>
          )
        })}
      </TBody>
    </Table>
  )
}
