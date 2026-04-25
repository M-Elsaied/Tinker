import { Card, CardContent } from '@/components/ui/card'
import { GlossaryTerm } from '@/components/ui/glossary-term'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { fmt } from '@/lib/utils'
import type { AnalysisResponse } from '@/types'
import type { GLOSSARY } from '@/data/glossary'

interface Stat {
  label: string
  value: number | null
  digits?: number
  hint?: string
  glossary?: keyof typeof GLOSSARY
  highlight?: 'good' | 'warn' | 'bad' | 'neutral'
}

export function ModelSummary({ a }: { a: AnalysisResponse }) {
  const stats: Stat[] = [
    { label: 'R²', value: a.r_squared, digits: 4, hint: 'Variation explained', glossary: 'r_squared',
      highlight: a.r_squared >= 0.9 ? 'good' : a.r_squared >= 0.7 ? 'neutral' : 'warn' },
    { label: 'Adj R²', value: a.adj_r_squared, digits: 4, hint: 'Adjusted for # terms', glossary: 'adj_r_squared' },
    { label: 'Pred R²', value: a.pred_r_squared, digits: 4, hint: 'Predictive power', glossary: 'pred_r_squared' },
    {
      label: 'Adeq Precision', value: a.adeq_precision, digits: 3, hint: 'S/N ratio (>4 desirable)',
      glossary: 'adeq_precision',
      highlight: (a.adeq_precision ?? 0) >= 4 ? 'good' : (a.adeq_precision ?? 0) >= 2 ? 'warn' : 'bad',
    },
    { label: 'Std Dev', value: a.std_dev, digits: 4 },
    { label: 'Mean', value: a.mean, digits: 4 },
    { label: 'CV %', value: a.cv_percent, digits: 3, glossary: 'cv' },
    { label: 'PRESS', value: a.press, digits: 4, glossary: 'press' },
  ]

  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-eyebrow mb-3">Fit statistics</div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-border-soft bg-muted/30 p-3 transition-colors hover:bg-muted/50"
            >
              <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                {s.glossary ? <GlossaryTerm term={s.glossary}>{s.label}</GlossaryTerm> : s.label}
              </div>
              <div className={`mono text-lg font-semibold mt-0.5 tabular-nums ${highlightClass(s.highlight)}`}>
                {s.value === null
                  ? '—'
                  : <AnimatedNumber value={s.value} decimals={s.digits} />}
              </div>
              {s.hint && (
                <div className="text-[10px] text-muted-foreground/70 mt-0.5 leading-snug">{s.hint}</div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function highlightClass(h?: Stat['highlight']): string {
  switch (h) {
    case 'good': return 'text-[hsl(var(--de-significant))]'
    case 'warn': return 'text-[hsl(var(--de-marginal))]'
    case 'bad': return 'text-[hsl(var(--de-insignificant))]'
    default: return ''
  }
}
