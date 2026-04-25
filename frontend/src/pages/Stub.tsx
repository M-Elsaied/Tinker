import { Construction } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'

export function Stub({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-4">
      <PageHeader title={title} description="Coming in a later phase." />
      <Card>
        <CardContent className="p-8 flex items-center gap-4 text-muted-foreground">
          <Construction className="h-8 w-8 text-amber-500 shrink-0" />
          <div>
            <div className="font-medium text-foreground">{title}</div>
            <div className="text-sm">{body}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
