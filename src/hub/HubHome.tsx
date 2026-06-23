import { ArrowRight } from 'lucide-react'
import { Logo } from '../ui/Logo'
import { CATEGORIES } from '../procedures/registry'
import './hub.css'

interface HubHomeProps {
  onSelectCategory: (categoryId: string) => void
}

export function HubHome({ onSelectCategory }: HubHomeProps) {
  return (
    <div className="hub">
      <div className="hub__inner">
        <header className="hub__header">
          <Logo height={32} />
          <h1 className="hub__title">Learn marine systems interactively</h1>
          <p className="hub__subtitle">
            Pick a topic area, then open a simulator to explore real physics and onboard systems hands-on.
          </p>
        </header>

        <div className="hub__grid">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className="hub-card hub-card--category"
              onClick={() => onSelectCategory(cat.id)}
            >
              <h2 className="hub-card__title">{cat.title}</h2>
              <p className="hub-card__desc">{cat.description}</p>
              <span className="hub-card__cta">
                Browse simulators <ArrowRight size={14} style={{ verticalAlign: -2, marginLeft: 4 }} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
