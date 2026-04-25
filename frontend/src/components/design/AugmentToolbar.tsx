import { useState } from 'react'
import { Plus, RotateCw, Sigma, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProjectStore } from '@/stores/projectStore'
import { augmentDesign } from '@/services/api'
import { saveProject } from '@/services/db'

export function AugmentToolbar() {
  const project = useProjectStore((s) => s.project)
  const setProject = useProjectStore((s) => s.setProject)
  const [busy, setBusy] = useState<string | null>(null)
  const [nCenters, setNCenters] = useState(2)
  const [alpha, setAlpha] = useState<number | ''>('')
  const [nReps, setNReps] = useState(1)
  const [error, setError] = useState<string | null>(null)

  if (!project) return null

  const apply = async (op: 'add_axial' | 'add_center' | 'fold_over' | 'add_replicate') => {
    setBusy(op)
    setError(null)
    try {
      const r = await augmentDesign({
        operation: op,
        factors: project.factors,
        coded_matrix: project.designRows.map((row) => row.coded),
        n_centers: nCenters,
        alpha: alpha === '' ? undefined : alpha,
        n_reps: nReps,
      })
      // Append (preserve old responses; new rows have null responses)
      const newDataLen = r.rows.length - project.designRows.length
      const responses = project.responses.map((resp) => ({
        ...resp,
        data: [...resp.data, ...Array(Math.max(newDataLen, 0)).fill(null)],
      }))
      const updated = {
        ...project,
        designRows: r.rows,
        responses,
        designInfo: { ...project.designInfo, augmented: op },
        updatedAt: Date.now(),
      }
      setProject(updated)
      await saveProject(updated)
    } catch (e) {
      const msg = (e as Error & { response?: { data?: { detail?: string } } }).response?.data?.detail
      setError(msg || (e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Augment design</CardTitle>
        <CardDescription className="text-xs">
          Add axial points to convert factorial → CCD, add center runs, fold-over to break aliases, or replicate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div>
            <Label className="text-[11px]">Center points to add</Label>
            <Input type="number" min={1} value={nCenters} onChange={(e) => setNCenters(Number(e.target.value))} />
          </div>
          <div>
            <Label className="text-[11px]">α (axial distance)</Label>
            <Input type="number" step="0.01" placeholder="auto (rotatable)" value={alpha} onChange={(e) => setAlpha(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          <div>
            <Label className="text-[11px]">Replicates to add</Label>
            <Input type="number" min={1} value={nReps} onChange={(e) => setNReps(Number(e.target.value))} />
          </div>
        </div>
        {error && <div className="text-[12px] text-destructive">{error}</div>}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => apply('add_axial')}>
            <Layers className="h-3.5 w-3.5" /> Add axial → CCD
          </Button>
          <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => apply('add_center')}>
            <Plus className="h-3.5 w-3.5" /> Add center pts
          </Button>
          <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => apply('fold_over')}>
            <RotateCw className="h-3.5 w-3.5" /> Fold-over
          </Button>
          <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => apply('add_replicate')}>
            <Sigma className="h-3.5 w-3.5" /> Replicate
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
