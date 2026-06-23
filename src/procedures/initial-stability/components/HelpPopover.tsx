import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Info, type LucideIcon } from 'lucide-react'

export function HelpPopover({
  title,
  children,
  icon: Icon = Info,
}: {
  title: string
  children: ReactNode
  icon?: LucideIcon
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverId = useId()

  useEffect(() => {
    if (!open || !triggerRef.current) return

    const updatePosition = () => {
      const rect = triggerRef.current!.getBoundingClientRect()
      const width = 260
      const margin = 12
      const left = Math.min(
        Math.max(margin, rect.right - width),
        window.innerWidth - width - margin,
      )
      const top = rect.bottom + 8
      setPos({ top, left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      const popover = document.getElementById(popoverId)
      if (popover?.contains(target)) return
      setOpen(false)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, popoverId])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="is-help-popover__trigger"
        aria-label={`Explain ${title}`}
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon size={14} strokeWidth={2} aria-hidden />
      </button>
      {open &&
        createPortal(
          <div
            id={popoverId}
            className="is-help-popover__panel"
            role="dialog"
            aria-label={title}
            style={{ top: pos.top, left: pos.left }}
          >
            <p className="is-help-popover__title">{title}</p>
            <div className="is-help-popover__text">{children}</div>
          </div>,
          document.body,
        )}
    </>
  )
}

export function FieldLabel({
  label,
  helpTitle,
  help,
}: {
  label: ReactNode
  helpTitle: string
  help: ReactNode
}) {
  return (
    <span className="is-field__label-row">
      <span className="is-field__label">{label}</span>
      <HelpPopover title={helpTitle}>{help}</HelpPopover>
    </span>
  )
}
