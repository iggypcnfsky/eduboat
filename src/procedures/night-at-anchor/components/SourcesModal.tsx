import { useSim } from '../store'
import { DEVICES } from '../sim/devices'

export function SourcesModal() {
  const open = useSim((s) => s.sourcesOpen)
  const setOpen = useSim((s) => s.setSourcesOpen)
  if (!open) return null

  return (
    <div className="naa-overlay" onClick={() => setOpen(false)}>
      <div className="naa-sources glass glass--strong scroll-y" onClick={(e) => e.stopPropagation()}>
        <span className="naa-beat__kicker">Sources &amp; assumptions</span>
        <h2 className="naa-beat__title" style={{ fontSize: 18 }}>
          Every number has a footnote
        </h2>

        <h3>Charging model</h3>
        <ul className="naa-sources__list">
          <li>
            Three-phase charging (bulk → absorption → float), bank acceptance current and the lead-acid 50% SOC rule:{' '}
            <em>Energy Unlimited</em>, Reinout Vader, Victron Energy — ch. 2 &amp; 4 (free PDF at
            victronenergy.com).
          </li>
          <li>
            Alternator: 70 A rated (typical 60–80 A marine unit). Real charge current is limited by what the bank
            accepts at a given SOC — not by the alternator rating.
          </li>
          <li>Solar: 200 W array ≈ 50–60 Ah/day in fair weather; output scales with sun elevation and cloud cover.</li>
        </ul>

        <h3>Device draws</h3>
        <ul className="naa-sources__list">
          {DEVICES.map((d) => (
            <li key={d.id}>
              <strong style={{ color: 'var(--text)' }}>{d.name}</strong> — {d.source}.
            </li>
          ))}
        </ul>

        <h3>Simplifications (v1)</h3>
        <ul className="naa-sources__list">
          <li>Temperature effects on capacity and charging are ignored.</li>
          <li>System voltage fixed at 13 V for W→A conversion; Peukert effect not modelled.</li>
          <li>Charging efficiency approximated as 100%; real banks lose ~5–15%.</li>
          <li>June daylight at ~45° N (sunrise 05:30, sunset 21:15).</li>
        </ul>

        <div className="naa-disclaimer">
          Independent educational concept — not affiliated with any manufacturer and not installation advice. Always
          follow the official manuals, and leave electrical installations to a certified marine installer.
        </div>

        <div className="naa-beat__actions">
          <button type="button" className="btn" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
