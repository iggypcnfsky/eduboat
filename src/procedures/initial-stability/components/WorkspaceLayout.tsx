import { useRef, useCallback, type ReactNode, type DragEvent } from 'react'
import { GripVertical } from 'lucide-react'
import {
  useWorkspace,
  PANEL_TITLES,
  type PanelId,
  type SlotId,
} from '../layoutStore'

interface WorkspaceLayoutProps {
  panels: Record<PanelId, ReactNode>
}

export function WorkspaceLayout({ panels }: WorkspaceLayoutProps) {
  const slots = useWorkspace((s) => s.slots)
  const sizes = useWorkspace((s) => s.sizes)
  const movePanelToSlot = useWorkspace((s) => s.movePanelToSlot)
  const setLeftColPx = useWorkspace((s) => s.setLeftColPx)
  const setRightColPx = useWorkspace((s) => s.setRightColPx)
  const setRightTopPct = useWorkspace((s) => s.setRightTopPct)
  const setRightMidPct = useWorkspace((s) => s.setRightMidPct)
  const resetLayout = useWorkspace((s) => s.resetLayout)

  const dragPanelRef = useRef<PanelId | null>(null)
  const rightColRef = useRef<HTMLDivElement>(null)

  const onDragStart = (panelId: PanelId) => (e: DragEvent) => {
    dragPanelRef.current = panelId
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', panelId)
  }

  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const onDrop = (slotId: SlotId) => (e: DragEvent) => {
    e.preventDefault()
    const panelId = (e.dataTransfer.getData('text/plain') || dragPanelRef.current) as PanelId
    if (panelId) movePanelToSlot(panelId, slotId)
    dragPanelRef.current = null
  }

  const resizeLeft = useResizeDrag(useCallback((dx) => setLeftColPx(sizes.leftColPx + dx), [sizes.leftColPx, setLeftColPx]))
  const resizeRight = useResizeDrag(useCallback((dx) => setRightColPx(sizes.rightColPx - dx), [sizes.rightColPx, setRightColPx]))
  const resizeRightTop = useResizeDrag(
    useCallback(
      (dy) => {
        const h = rightColRef.current?.getBoundingClientRect().height ?? 1
        setRightTopPct(sizes.rightTopPct + (dy / h) * 100)
      },
      [sizes.rightTopPct, setRightTopPct],
    ),
  )
  const resizeRightMid = useResizeDrag(
    useCallback(
      (dy) => {
        const h = rightColRef.current?.getBoundingClientRect().height ?? 1
        setRightMidPct(sizes.rightMidPct + (dy / h) * 100)
      },
      [sizes.rightMidPct, setRightMidPct],
    ),
  )

  const renderWindow = (slotId: SlotId, className?: string) => {
    const panelId = slots[slotId]
    return (
      <WorkspaceWindow
        key={slotId}
        slotId={slotId}
        panelId={panelId}
        className={className}
        onDragStart={onDragStart(panelId)}
        onDragOver={onDragOver}
        onDrop={onDrop(slotId)}
      >
        {panels[panelId]}
      </WorkspaceWindow>
    )
  }

  return (
    <div
      className="is-workspace"
      style={
        {
          '--is-left-w': `${sizes.leftColPx}px`,
          '--is-right-w': `${sizes.rightColPx}px`,
          '--is-right-top-pct': `${sizes.rightTopPct}%`,
          '--is-right-mid-pct': `${sizes.rightMidPct}%`,
        } as React.CSSProperties
      }
    >
      <div className="is-workspace__col is-workspace__col--left">{renderWindow('left')}</div>

      <div className="is-gutter is-gutter--v" {...resizeLeft} aria-hidden />

      <div className="is-workspace__col is-workspace__col--center">{renderWindow('center')}</div>

      <div className="is-gutter is-gutter--v" {...resizeRight} aria-hidden />

      <div ref={rightColRef} className="is-workspace__col is-workspace__col--right">
        {renderWindow('rightTop', 'is-window--rightTop')}
        <div className="is-gutter is-gutter--h" {...resizeRightTop} aria-hidden />
        {renderWindow('rightMid', 'is-window--rightMid')}
        <div className="is-gutter is-gutter--h" {...resizeRightMid} aria-hidden />
        {renderWindow('rightBottom', 'is-window--rightBottom')}
      </div>

      <button type="button" className="is-workspace__reset" onClick={resetLayout} title="Reset panel layout">
        Reset layout
      </button>
    </div>
  )
}

function WorkspaceWindow({
  slotId,
  panelId,
  className,
  children,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  slotId: SlotId
  panelId: PanelId
  className?: string
  children: ReactNode
  onDragStart: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDrop: (e: DragEvent) => void
}) {
  return (
    <section
      className={`is-window is-window--${slotId}${className ? ` ${className}` : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <header className="is-window__header" draggable onDragStart={onDragStart}>
        <GripVertical size={14} className="is-window__grip" />
        <span className="is-window__title">{PANEL_TITLES[panelId]}</span>
      </header>
      <div className="is-window__body">{children}</div>
    </section>
  )
}

function useResizeDrag(onDelta: (dx: number, dy: number) => void) {
  const startRef = useRef({ x: 0, y: 0 })

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    startRef.current = { x: e.clientX, y: e.clientY }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return
      const dx = e.clientX - startRef.current.x
      const dy = e.clientY - startRef.current.y
      if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
        onDelta(dx, dy)
        startRef.current = { x: e.clientX, y: e.clientY }
      }
    },
    [onDelta],
  )

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }, [])

  return { onPointerDown, onPointerMove, onPointerUp }
}
