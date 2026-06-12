import { useSim } from '../store'

export function MobileTabs() {
  const sheet = useSim((s) => s.sheet)
  const setSheet = useSim((s) => s.setSheet)
  const view = useSim((s) => s.view)

  return (
    <div className="naa-mobile-tabs">
      {view !== 'schematic' && (
        <button
          type="button"
          className={sheet === 'setup' ? 'is-active' : ''}
          onClick={() => setSheet(sheet === 'setup' ? null : 'setup')}
        >
          Setup
        </button>
      )}
      <button
        type="button"
        className={sheet === 'energy' ? 'is-active' : ''}
        onClick={() => setSheet(sheet === 'energy' ? null : 'energy')}
      >
        Energy
      </button>
    </div>
  )
}
