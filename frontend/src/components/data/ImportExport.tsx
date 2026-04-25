import { useRef } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/stores/projectStore'

export function ImportExport() {
  const project = useProjectStore((s) => s.project)
  const update = useProjectStore((s) => s.updateResponseValue)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!project) return null

  const handleExport = () => {
    const factorNames = project.factors.map((f) => f.name)
    const responseNames = project.responses.map((r) => r.name)
    const headers = ['Run', 'Std', 'Type', ...factorNames, ...responseNames]
    const rows = project.designRows.map((r, i) => [
      r.run,
      r.std_order,
      r.point_type,
      ...r.actual,
      ...project.responses.map((rr) => rr.data[i] ?? ''),
    ])
    const csv = Papa.unparse({ fields: headers, data: rows })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/\s+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportXlsx = () => {
    const factorNames = project.factors.map((f) => f.name)
    const responseNames = project.responses.map((r) => r.name)
    const headers = ['Run', 'Std', 'Type', ...factorNames, ...responseNames]
    const rows = project.designRows.map((r, i) => [
      r.run,
      r.std_order,
      r.point_type,
      ...r.actual,
      ...project.responses.map((rr) => rr.data[i] ?? ''),
    ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Design')
    XLSX.writeFile(wb, `${project.name.replace(/\s+/g, '_')}.xlsx`)
  }

  const handleImport = async (file: File) => {
    const text = await file.text()
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })
    if (parsed.errors.length) {
      alert('CSV parse error: ' + parsed.errors[0].message)
      return
    }
    const rows = parsed.data
    project.responses.forEach((resp, respIdx) => {
      rows.forEach((row, rowIdx) => {
        if (rowIdx >= project.designRows.length) return
        const raw = row[resp.name]
        if (raw === undefined || raw === '') return
        const v = Number(raw)
        if (!Number.isNaN(v)) update(respIdx, rowIdx, v)
      })
    })
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handleImport(f)
        }}
      />
      <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
        <Upload className="h-3.5 w-3.5" />
        Import CSV
      </Button>
      <Button size="sm" variant="outline" onClick={handleExport}>
        <Download className="h-3.5 w-3.5" />
        CSV
      </Button>
      <Button size="sm" variant="outline" onClick={handleExportXlsx}>
        <Download className="h-3.5 w-3.5" />
        Excel
      </Button>
    </div>
  )
}
