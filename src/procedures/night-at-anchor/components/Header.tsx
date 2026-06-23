import { Logo } from '../../../ui/Logo'
import { Segmented } from '../../../ui/Segmented'
import { useAppNav } from '../../../nav/AppNavContext'
import { useSim, type ViewMode } from '../store'
import { Timeline } from './Timeline'
import { ArrowLeft } from 'lucide-react'

const VIEW_OPTIONS = ['3d', 'schematic'] as const

export function Header() {
  const nav = useAppNav()
  const view = useSim((s) => s.view)
  const setView = useSim((s) => s.setView)
  const setSourcesOpen = useSim((s) => s.setSourcesOpen)
  const lessonsOpen = useSim((s) => s.schematicLessonsOpen)
  const setLessonsOpen = useSim((s) => s.setSchematicLessonsOpen)

  return (
    <header className="naa-header">
      <div className="naa-header__brand">
        {nav && (
          <button type="button" className="naa-header__back" onClick={nav.onBack}>
            <ArrowLeft size={16} />
          </button>
        )}
        <Logo />
        <Segmented<ViewMode>
          options={VIEW_OPTIONS as unknown as ViewMode[]}
          value={view}
          onChange={setView}
          format={(v) => (v === '3d' ? '3D' : 'Schematic')}
        />
      </div>

      <Timeline />

      <div className="naa-header__right">
        {view === 'schematic' && !lessonsOpen && (
          <button
            type="button"
            className="naa-header__sources naa-header__lessons"
            onClick={() => setLessonsOpen(true)}
          >
            Lessons
          </button>
        )}
        <button type="button" className="naa-header__sources" onClick={() => setSourcesOpen(true)}>
          Sources
        </button>
      </div>
    </header>
  )
}
