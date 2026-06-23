import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getCategory, getProceduresForCategory } from '../procedures/registry'
import './hub.css'

interface CategoryPageProps {
  categoryId: string
  onBack: () => void
  onSelectProcedure: (procedureId: string) => void
}

export function CategoryPage({ categoryId, onBack, onSelectProcedure }: CategoryPageProps) {
  const category = getCategory(categoryId)
  const procedures = getProceduresForCategory(categoryId)

  if (!category) return null

  return (
    <div className="hub">
      <div className="hub__inner">
        <button type="button" className="hub__back" onClick={onBack}>
          <ArrowLeft size={14} />
          All topics
        </button>

        <header className="hub__header">
          <h1 className="hub__title">{category.title}</h1>
          <p className="hub__subtitle">{category.description}</p>
        </header>

        <div className="hub__grid">
          {procedures.map((proc) => (
            <button
              key={proc.id}
              type="button"
              className="hub-card hub-card--sim"
              onClick={() => onSelectProcedure(proc.id)}
            >
              <span className="hub-card__tag">Simulator</span>
              <h2 className="hub-card__title">{proc.title}</h2>
              <p className="hub-card__desc">{proc.oneLiner}</p>
              <span className="hub-card__cta">
                Open <ArrowRight size={14} style={{ verticalAlign: -2, marginLeft: 4 }} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
