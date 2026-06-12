import type { ReactNode } from 'react'

export function PanelCard({
  title,
  icon,
  children,
  className = '',
}: {
  title: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`naa-card ${className}`.trim()}>
      <div className="naa-panel__section-title">
        {icon && <span className="naa-panel__title-icon">{icon}</span>}
        {title}
      </div>
      {children}
    </section>
  )
}
