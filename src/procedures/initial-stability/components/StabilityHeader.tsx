import { ArrowLeft } from 'lucide-react'
import { Logo } from '../../../ui/Logo'
import { useAppNav } from '../../../nav/AppNavContext'

export function StabilityHeader() {
  const nav = useAppNav()

  return (
    <header className="is-header">
      <div className="is-header__left">
        {nav && (
          <button type="button" className="is-header__back" onClick={nav.onBack}>
            <ArrowLeft size={16} />
            {nav.categoryTitle}
          </button>
        )}
        <Logo height={24} />
        <span className="is-header__title">Initial Stability</span>
      </div>
    </header>
  )
}
