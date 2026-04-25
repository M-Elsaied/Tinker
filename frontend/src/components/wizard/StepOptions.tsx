import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { CCDType, DesignType } from '@/types'

export function StepOptions(props: {
  designType: DesignType
  nFactors: number
  centerPoints: number
  setCenterPoints: (n: number) => void
  replicates: number
  setReplicates: (n: number) => void
  randomize: boolean
  setRandomize: (b: boolean) => void
  seed: number | null
  setSeed: (n: number | null) => void
  fraction: number
  setFraction: (n: number) => void
  ccdType: CCDType
  setCcdType: (c: CCDType) => void
  alpha: number | null
  setAlpha: (n: number | null) => void
}) {
  const {
    designType,
    nFactors,
    centerPoints,
    setCenterPoints,
    replicates,
    setReplicates,
    randomize,
    setRandomize,
    seed,
    setSeed,
    fraction,
    setFraction,
    ccdType,
    setCcdType,
    alpha,
    setAlpha,
  } = props

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="cp">Center points</Label>
          <Input
            id="cp"
            type="number"
            min={0}
            value={centerPoints}
            onChange={(e) => setCenterPoints(Math.max(0, Number(e.target.value)))}
          />
          <p className="text-xs text-muted-foreground">
            Adds runs at the design center. Useful for curvature checks and pure error.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reps">Replicates</Label>
          <Input
            id="reps"
            type="number"
            min={1}
            value={replicates}
            onChange={(e) => setReplicates(Math.max(1, Number(e.target.value)))}
          />
          <p className="text-xs text-muted-foreground">
            Number of full design replications. Increases pure error degrees of freedom.
          </p>
        </div>
      </div>

      {designType === 'fractional_factorial' && (
        <div className="space-y-1.5">
          <Label htmlFor="frac">Fraction (p)</Label>
          <Input
            id="frac"
            type="number"
            min={1}
            max={Math.max(1, nFactors - 2)}
            value={fraction}
            onChange={(e) => setFraction(Math.max(1, Number(e.target.value)))}
          />
          <p className="text-xs text-muted-foreground">
            Generates 2^({nFactors}–{fraction}) = {2 ** Math.max(0, nFactors - fraction)} factorial runs.
          </p>
        </div>
      )}

      {designType === 'ccd' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>CCD type</Label>
            <Select
              value={ccdType}
              onChange={(e) => setCcdType(e.target.value as CCDType)}
            >
              <option value="circumscribed">Circumscribed (rotatable)</option>
              <option value="face_centered">Face-centered (α = 1)</option>
              <option value="inscribed">Inscribed (within ±1)</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Alpha (axial distance)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder={`Auto: ${(2 ** nFactors) ** 0.25 == 0 ? '' : (2 ** nFactors) ** 0.25}`}
              value={alpha ?? ''}
              onChange={(e) =>
                setAlpha(e.target.value === '' ? null : Number(e.target.value))
              }
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use the rotatable default.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={randomize}
              onChange={(e) => setRandomize(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            Randomize run order
          </Label>
          <p className="text-xs text-muted-foreground">
            Strongly recommended to guard against systematic bias.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="seed">Random seed</Label>
          <Input
            id="seed"
            type="number"
            placeholder="auto"
            value={seed ?? ''}
            onChange={(e) =>
              setSeed(e.target.value === '' ? null : Number(e.target.value))
            }
            disabled={!randomize}
          />
        </div>
      </div>
    </div>
  )
}
