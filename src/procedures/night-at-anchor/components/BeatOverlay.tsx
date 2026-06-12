import { useSim, useSnapshot } from '../store'
import { DEVICE_MAP } from '../sim/devices'
import { CHEMISTRIES } from '../sim/battery'
import { ChargeCurve } from './ChargeCurve'
import type { DeviceId } from '../sim/types'

function NightSummary() {
  const snap = useSnapshot()
  const ranked = (Object.entries(snap.ahByDevice) as Array<[DeviceId, number]>)
    .filter(([, ah]) => ah > 0.05)
    .sort((a, b) => b[1] - a[1])
  const max = ranked[0]?.[1] ?? 1

  return (
    <>
      <span className="naa-beat__kicker">Morning check · 08:00</span>
      <h2 className="naa-beat__title">
        You slept. The bank gave back <span className="num">{snap.ahOut.toFixed(0)} Ah</span>.
      </h2>
      <p className="naa-beat__body">
        Here&apos;s who ate them overnight — the fridge cycles even when nothing seems to be happening, and the
        anchor-alarm plotter quietly runs all night:
      </p>
      <div className="naa-rank">
        {ranked.map(([id, ah]) => (
          <div key={id} className="naa-rank__row">
            <span className="naa-rank__name">{DEVICE_MAP[id].name}</span>
            <div>
              <div className="naa-rank__bar" style={{ width: `${(ah / max) * 100}%` }} />
            </div>
            <span className="naa-rank__val num">{ah.toFixed(1)} Ah</span>
          </div>
        ))}
      </div>
      <p className="naa-beat__body">
        This is the morning ritual: check SOC, compare with what you planned, then decide whether — and how long — to
        charge.
      </p>
    </>
  )
}

function EngineCharging() {
  const snap = useSnapshot()
  const config = useSim((s) => s.config)
  return (
    <>
      <span className="naa-beat__kicker">Engine started</span>
      <h2 className="naa-beat__title">Why the last 20% takes hours</h2>
      <p className="naa-beat__body">
        In <strong>bulk</strong>, the bank takes everything the alternator gives. But around{' '}
        <span className="num">{CHEMISTRIES[config.chemistry].absorptionStartSoc}%</span> SOC it switches to{' '}
        <strong>absorption</strong>: voltage holds steady and the current the battery accepts keeps falling. An hour of
        engine gets you to &quot;almost full&quot; fast — the rest is a long tail no amount of revving will shorten.
      </p>
      <ChargeCurve from={snap} config={config} />
      <p className="naa-beat__body">
        Watch the live current in the Schematic view as the phases change. Stopping mid-absorption again and again is
        what slowly kills lead-acid banks.
      </p>
      <span className="naa-beat__footnote">Source: Energy Unlimited (Victron Energy), ch. 4.2</span>
    </>
  )
}

function SocFloor() {
  const config = useSim((s) => s.config)
  const chem = CHEMISTRIES[config.chemistry]
  return (
    <>
      <span className="naa-beat__kicker naa-beat__kicker--alarm">Bank protection</span>
      <h2 className="naa-beat__title">
        You crossed the <span className="num">{chem.floorSoc}%</span> line
      </h2>
      <p className="naa-beat__body">{chem.floorNote}</p>
      <p className="naa-beat__body">
        The battery bank is the most expensive consumable on board. Shed some load (the heater and fridge are the big
        eaters) or start charging — and next time, plan the night so you never get here.
      </p>
      <span className="naa-beat__footnote">Source: Energy Unlimited (Victron Energy), ch. 2 &amp; 4</span>
    </>
  )
}

function DaySummary({ onRestart }: { onRestart: () => void }) {
  const snap = useSnapshot()
  const config = useSim((s) => s.config)
  const fridgeAh = snap.ahByDevice.fridge ?? 0
  return (
    <>
      <span className="naa-beat__kicker">18:00 · Full day at anchor</span>
      <h2 className="naa-beat__title">Your 24-hour energy balance</h2>
      <div className="stat-grid">
        <div className="stat-cell">
          <div className="stat-cell__label">Consumed</div>
          <div className="stat-cell__value num is-out">{snap.ahOut.toFixed(0)} Ah</div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell__label">Charged</div>
          <div className="stat-cell__value num is-in">{snap.ahIn.toFixed(0)} Ah</div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell__label">SOC start → end</div>
          <div className="stat-cell__value num">
            {config.startSoc}% → {snap.soc.toFixed(0)}%
          </div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell__label">Fridge alone</div>
          <div className="stat-cell__value num is-out">{fridgeAh.toFixed(0)} Ah</div>
        </div>
      </div>
      <p className="naa-beat__body">
        That&apos;s one quiet day — no watermaker, no inverter, no second fridge. Thinking of adding one? Check whether
        your <span className="num">{config.capacityAh} Ah</span> {config.chemistry} bank can take it: re-run the day
        with different devices, bank size and weather.
      </p>
      <div className="naa-beat__actions">
        <button type="button" className="btn btn--primary" onClick={onRestart}>
          Run another day
        </button>
      </div>
    </>
  )
}

export function BeatOverlay() {
  const activeBeat = useSim((s) => s.activeBeat)
  const dismissBeat = useSim((s) => s.dismissBeat)
  const restart = useSim((s) => s.restart)

  if (!activeBeat) return null

  return (
    <div className="naa-overlay" onClick={dismissBeat}>
      <div className="naa-beat glass glass--strong" onClick={(e) => e.stopPropagation()}>
        {activeBeat === 'night-summary' && <NightSummary />}
        {activeBeat === 'engine-charging' && <EngineCharging />}
        {activeBeat === 'soc-floor' && <SocFloor />}
        {activeBeat === 'day-summary' && <DaySummary onRestart={restart} />}
        {activeBeat !== 'day-summary' && (
          <div className="naa-beat__actions">
            <button type="button" className="btn" onClick={dismissBeat}>
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}