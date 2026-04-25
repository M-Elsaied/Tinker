import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useProjectStore } from '@/stores/projectStore'
import { EXAMPLES } from '@/data/examples'
import { cn } from '@/lib/utils'

export function ExampleBanner() {
  const project = useProjectStore((s) => s.project)
  const [open, setOpen] = useState(true)

  if (!project) return null
  const exId = project.designInfo?.exampleId as string | undefined
  if (!exId) return null
  const ex = EXAMPLES.find((e) => e.id === exId)
  if (!ex) return null

  return (
    <Card className="border-sig/40 bg-sig-muted/30">
      <CardContent className="p-4">
        <button
          className="w-full flex items-start justify-between gap-3 text-left"
          onClick={() => setOpen((o) => !o)}
        >
          <div className="flex items-start gap-3 flex-1">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-sig text-white shrink-0">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">Worked example: {ex.shortName}</span>
                <Badge variant="success">example</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{ex.story}</p>
            </div>
          </div>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </button>

        <div
          className={cn(
            'overflow-hidden transition-all',
            open ? 'mt-3 max-h-96' : 'max-h-0',
          )}
        >
          <div className="rounded-md bg-card border p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sig">
              <Lightbulb className="h-3.5 w-3.5" />
              Things to try
            </div>
            <ol className="space-y-1.5 pl-4 list-decimal text-sm">
              {ex.takeaways.map((t, i) => (
                <li key={i} className="leading-relaxed">{t}</li>
              ))}
            </ol>
            <div className="text-[11px] text-muted-foreground italic mt-2">{ex.source}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
