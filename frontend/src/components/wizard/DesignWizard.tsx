import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { generateDesign } from '@/services/api'
import { useProjectStore } from '@/stores/projectStore'
import type {
  CCDType,
  DesignType,
  Factor,
  GenerateDesignResponse,
} from '@/types'
import { StepFactors } from './StepFactors'
import { StepDesignType } from './StepDesignType'
import { StepOptions } from './StepOptions'
import { StepReview } from './StepReview'

type Step = 0 | 1 | 2 | 3

export function DesignWizard() {
  const navigate = useNavigate()
  const newProject = useProjectStore((s) => s.newProject)

  const [step, setStep] = useState<Step>(0)
  const [name, setName] = useState('My Experiment')
  const [factors, setFactors] = useState<Factor[]>([
    { name: 'A', low: -1, high: 1, units: '' },
    { name: 'B', low: -1, high: 1, units: '' },
  ])
  const [designType, setDesignType] = useState<DesignType>('full_factorial')
  const [centerPoints, setCenterPoints] = useState(0)
  const [replicates, setReplicates] = useState(1)
  const [randomize, setRandomize] = useState(true)
  const [seed, setSeed] = useState<number | null>(42)
  const [fraction, setFraction] = useState(1)
  const [ccdType, setCcdType] = useState<CCDType>('circumscribed')
  const [alpha, setAlpha] = useState<number | null>(null)
  const [responseNames, setResponseNames] = useState<string[]>(['Yield'])
  const [preview, setPreview] = useState<GenerateDesignResponse | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const steps = [
    { name: 'Factors', sub: 'Define inputs' },
    { name: 'Design', sub: 'Choose type' },
    { name: 'Options', sub: 'Configure runs' },
    { name: 'Review', sub: 'Generate' },
  ]

  const canAdvance = (): boolean => {
    if (step === 0) {
      if (factors.length < 2) return false
      if (factors.some((f) => !f.name.trim() || f.high <= f.low)) return false
      if (responseNames.some((n) => !n.trim())) return false
      return true
    }
    return true
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const resp = await generateDesign({
        design_type: designType,
        factors,
        center_points: centerPoints,
        replicates,
        randomize,
        seed: seed ?? undefined,
        fraction: designType === 'fractional_factorial' ? fraction : undefined,
        ccd_type: ccdType,
        alpha: alpha,
      })
      setPreview(resp)
    } catch (e) {
      const msg = (e as Error & { response?: { data?: { detail?: string } } })
        .response?.data?.detail
      setError(msg || (e as Error).message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleAccept = () => {
    if (!preview) return
    newProject({
      name,
      designType,
      factors,
      designRows: preview.rows,
      designInfo: preview.info,
      responseNames,
    })
    navigate('/project/data')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Create new design</CardTitle>
            <CardDescription>Guided setup for a new DOE experiment</CardDescription>
          </div>
          <Stepper steps={steps.map((s) => s.name)} active={step} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="exp-name">Experiment name</Label>
          <Input
            id="exp-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Yield optimization study"
          />
        </div>

        {step === 0 && (
          <StepFactors
            factors={factors}
            setFactors={setFactors}
            responseNames={responseNames}
            setResponseNames={setResponseNames}
          />
        )}

        {step === 1 && (
          <StepDesignType
            value={designType}
            onChange={setDesignType}
            nFactors={factors.length}
            fraction={fraction}
            setFraction={setFraction}
          />
        )}

        {step === 2 && (
          <StepOptions
            designType={designType}
            nFactors={factors.length}
            centerPoints={centerPoints}
            setCenterPoints={setCenterPoints}
            replicates={replicates}
            setReplicates={setReplicates}
            randomize={randomize}
            setRandomize={setRandomize}
            seed={seed}
            setSeed={setSeed}
            fraction={fraction}
            setFraction={setFraction}
            ccdType={ccdType}
            setCcdType={setCcdType}
            alpha={alpha}
            setAlpha={setAlpha}
          />
        )}

        {step === 3 && (
          <StepReview
            preview={preview}
            generating={generating}
            error={error}
            factors={factors}
            onGenerate={handleGenerate}
          />
        )}

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => setStep((step - 1) as Step)}
            disabled={step === 0}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {step < 3 ? (
            <Button
              onClick={() => setStep((step + 1) as Step)}
              disabled={!canAdvance()}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-2">
              {!preview && (
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Generate
                </Button>
              )}
              {preview && (
                <Button onClick={handleAccept}>
                  <CheckCircle2 className="h-4 w-4" />
                  Accept &amp; open
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function Stepper({ steps, active }: { steps: string[]; active: number }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
              i < active && 'bg-sig text-primary-foreground',
              i === active && 'bg-primary text-primary-foreground',
              i > active && 'bg-muted text-muted-foreground',
            )}
          >
            {i + 1}
          </div>
          <span
            className={cn(
              'text-xs',
              i === active ? 'font-medium' : 'text-muted-foreground',
            )}
          >
            {s}
          </span>
          {i < steps.length - 1 && <div className="h-px w-6 bg-border" />}
        </div>
      ))}
    </div>
  )
}
