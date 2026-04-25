import { ReportPageBlock } from './ReportShell'
import { GLOSSARY } from '@/data/glossary'

export function GlossaryAppendix() {
  const entries = Object.entries(GLOSSARY).sort(([, a], [, b]) => a.label.localeCompare(b.label))
  return (
    <ReportPageBlock id="glossary">
      <h2 className="report-h2">Glossary</h2>
      <div className="space-y-3">
        {entries.map(([key, e]) => (
          <div key={key} className="rounded-md border border-border-soft p-3 report-no-break">
            <div className="text-[13px] font-semibold">{e.label}</div>
            <div className="text-[12px] text-foreground/80 mt-0.5">{e.definition}</div>
            {e.formula && <div className="mono text-[11px] mt-1.5 bg-muted/40 rounded px-2 py-1">{e.formula}</div>}
            {e.ruleOfThumb && <div className="text-[11px] italic text-muted-foreground mt-1">Rule of thumb: {e.ruleOfThumb}</div>}
          </div>
        ))}
      </div>
    </ReportPageBlock>
  )
}
