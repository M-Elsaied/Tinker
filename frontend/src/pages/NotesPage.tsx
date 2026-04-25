import { useEffect, useState } from 'react'
import { FileText, Save } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RequireProject } from '@/components/layout/RequireProject'
import { useProjectStore } from '@/stores/projectStore'
import { saveProject } from '@/services/db'
import { toast } from '@/lib/toast'

export function NotesPage() {
  return (
    <RequireProject illustration="sliders" title="Open an experiment to add notes">
      <NotesInner />
    </RequireProject>
  )
}

function NotesInner() {
  const project = useProjectStore((s) => s.project)!
  const setProject = useProjectStore((s) => s.setProject)
  const [text, setText] = useState('')

  useEffect(() => {
    setText((project.designInfo?.notes as string | undefined) ?? '')
  }, [project])

  const handleSave = async () => {
    const updated = { ...project, designInfo: { ...project.designInfo, notes: text }, updatedAt: Date.now() }
    setProject(updated)
    await saveProject(updated)
    toast.success('Notes saved', { description: project.name })
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notes"
        description="Free-form notes about your experiment, methodology, or findings."
        actions={
          <Button size="sm" onClick={handleSave}>
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
        }
      />
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">{project.name}</CardTitle>
          </div>
          <CardDescription className="text-xs">Stored locally in your browser.</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'# Experiment notes\n\n## Hypothesis\n\n## Procedure\n\n## Observations\n'}
            className="w-full min-h-[400px] font-mono text-[13px] p-3 rounded-md border border-border-soft bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
        </CardContent>
      </Card>
    </div>
  )
}
