import { useSim, useSnapshot } from '../store'
import { ALTERNATOR_RATED_A, FUEL_CONSUMPTION_LPH, FUEL_TANK_L, SOLAR_W } from '../sim/constants'
import { PanelCard } from './PanelCard'

export function EnginePanel() {
  const snap = useSnapshot()
  const config = useSim((s) => s.config)
  const setEngine = useSim((s) => s.setEngine)
  const setCloudCover = useSim((s) => s.setCloudCover)
  const setStartFuel = useSim((s) => s.setStartFuel)

  const fuelPct = (snap.fuelL / FUEL_TANK_L) * 100
  const lowFuel = snap.fuelL > 0 && snap.fuelL <= 5
  const outOfFuel = snap.fuelL <= 0
  const engineStalled = config.engineOn && outOfFuel

  return (
    <PanelCard title="Engine & charging" className="naa-card--engine">
      <div className="engine-sliders">
        <label className="engine-slider">
          <span className="engine-slider__head">
            <span>Cloud · {SOLAR_W} W</span>
            <span className="num">{Math.round(config.cloudCover * 100)}%</span>
          </span>
          <input
            className="naa-slider naa-slider--thin"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={config.cloudCover}
            onChange={(e) => setCloudCover(Number(e.target.value))}
            aria-label="Cloud cover"
          />
        </label>
        <label className="engine-slider">
          <span className="engine-slider__head">
            <span>Fuel at 18:00</span>
            <span className="num">
              {config.startFuelL}/{FUEL_TANK_L} L
            </span>
          </span>
          <input
            className="naa-slider naa-slider--thin"
            type="range"
            min={0}
            max={FUEL_TANK_L}
            step={1}
            value={config.startFuelL}
            onChange={(e) => setStartFuel(Number(e.target.value))}
            aria-label="Starting fuel level"
          />
        </label>
      </div>

      <div className="engine-actions">
        <div className="engine-fuel">
          <div className="engine-fuel__row">
            <span className="engine-fuel__label">Fuel left</span>
            <span className={`engine-fuel__val num ${lowFuel || outOfFuel ? 'is-out' : ''}`}>
              {snap.fuelL.toFixed(1)} L
            </span>
          </div>
          <div className="fuel-gauge__track fuel-gauge__track--thin">
            <div
              className={`fuel-gauge__fill ${lowFuel ? 'is-low' : ''} ${outOfFuel ? 'is-empty' : ''}`}
              style={{ width: `${fuelPct}%` }}
            />
          </div>
          <span className="engine-fuel__hint num">~{FUEL_CONSUMPTION_LPH} L/h · alt {ALTERNATOR_RATED_A} A</span>
        </div>
        <button
          type="button"
          className={`btn btn--compact ${config.engineOn ? 'btn--engine-on' : 'btn--primary'}`}
          disabled={outOfFuel && !config.engineOn}
          onClick={() => setEngine(!config.engineOn)}
        >
          {config.engineOn ? 'Stop' : 'Start'}
        </button>
      </div>

      {engineStalled && <div className="naa-warning naa-warning--warn naa-warning--tiny">Tank empty</div>}
    </PanelCard>
  )
}
