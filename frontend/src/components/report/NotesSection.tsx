import { ReportPageBlock } from './ReportShell'
import type { Project } from '@/types'

export function NotesSection({ project }: { project: Project }) {
  const notes = (project.designInfo?.notes as string | undefined) ?? ''
  if (!notes.trim()) return null
  return (
    <ReportPageBlock id="notes">
      <h2 className="report-h2">Notes</h2>
      <pre className="mono text-[12.5px] whitespace-pre-wrap leading-relaxed text-foreground">{notes}</pre>
    </ReportPageBlock>
  )
}
