import { type ReactNode } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import type { PaneLayout } from '@/stores/uiStore'

interface Props {
  layout: PaneLayout
  /** Render-prop: receives pane index, returns content. Indices follow row-major order. */
  renderPane: (index: number) => ReactNode
}

const handle = (
  <PanelResizeHandle className="w-1 hover:bg-primary/40 transition-colors data-[resize-handle-state=hover]:bg-primary/40" />
)

const handleH = (
  <PanelResizeHandle className="h-1 hover:bg-primary/40 transition-colors data-[resize-handle-state=hover]:bg-primary/40" />
)

export function PaneGrid({ layout, renderPane }: Props) {
  if (layout === '1') {
    return <div className="h-full">{renderPane(0)}</div>
  }
  if (layout === '2-h') {
    return (
      <PanelGroup direction="horizontal" className="h-full">
        <Panel defaultSize={50} minSize={25}>{renderPane(0)}</Panel>
        {handle}
        <Panel defaultSize={50} minSize={25}>{renderPane(1)}</Panel>
      </PanelGroup>
    )
  }
  if (layout === '2-v') {
    return (
      <PanelGroup direction="vertical" className="h-full">
        <Panel defaultSize={50} minSize={20}>{renderPane(0)}</Panel>
        {handleH}
        <Panel defaultSize={50} minSize={20}>{renderPane(1)}</Panel>
      </PanelGroup>
    )
  }
  if (layout === '2x2') {
    return (
      <PanelGroup direction="vertical" className="h-full">
        <Panel defaultSize={50} minSize={20}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize={50} minSize={20}>{renderPane(0)}</Panel>
            {handle}
            <Panel defaultSize={50} minSize={20}>{renderPane(1)}</Panel>
          </PanelGroup>
        </Panel>
        {handleH}
        <Panel defaultSize={50} minSize={20}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize={50} minSize={20}>{renderPane(2)}</Panel>
            {handle}
            <Panel defaultSize={50} minSize={20}>{renderPane(3)}</Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    )
  }
  // 3x2 — 3 columns × 2 rows = 6 panes
  if (layout === '3x2' || layout === '2x3') {
    return (
      <PanelGroup direction="vertical" className="h-full">
        <Panel defaultSize={50} minSize={20}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize={33} minSize={15}>{renderPane(0)}</Panel>
            {handle}
            <Panel defaultSize={33} minSize={15}>{renderPane(1)}</Panel>
            {handle}
            <Panel defaultSize={34} minSize={15}>{renderPane(2)}</Panel>
          </PanelGroup>
        </Panel>
        {handleH}
        <Panel defaultSize={50} minSize={20}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize={33} minSize={15}>{renderPane(3)}</Panel>
            {handle}
            <Panel defaultSize={33} minSize={15}>{renderPane(4)}</Panel>
            {handle}
            <Panel defaultSize={34} minSize={15}>{renderPane(5)}</Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    )
  }
  return null
}
