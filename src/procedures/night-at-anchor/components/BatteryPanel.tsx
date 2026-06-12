import { useMemo } from 'react'
import { Segmented } from '../../../ui/Segmented'
import { useSim, useSnapshot } from '../store'
import { CHEMISTRIES } from '../sim/battery'
import { forecast } from '../sim/engine'
import { EVENT_MINUTES, DAY_MINUTES } from '../sim/constants'
import { SocGauge } from './SocGauge'
import { PanelCard } from './PanelCard'
import type { Chemistry } from '../sim/types'

const CAPACITIES = [200, 300, 400] as const
const CHEM_OPTIONS: Chemistry[] = ['AGM', 'LiFePO4']

export function BatteryPanel() {
  const snap = useSnapshot()
  const config = useSim((s) => s.config)
  const setCapacity = useSim((s) => s.setCapacity)
  const setChemistry = useSim((s) => s.setChemistry)
  const setStartSoc = useSim((s) => s.setStartSoc)

  const chem = CHEMISTRIES[config.chemistry]
  const belowFloor = snap.soc < chem.floorSoc

  const forecastInfo = useMemo(() => {
    const beforeMorning = snap.minute < EVENT_MINUTES.morning
    const until = beforeMorning ? EVENT_MINUTES.morning : DAY_MINUTES
    if (snap.minute >= DAY_MINUTES) return null
    const f = forecast(snap, config, until)
    return { label: beforeMorning ? '08:00' : '18:00', soc: f.soc }
  }, [snap, config])

  return (
    <PanelCard title="Battery bank" className="naa-card--battery">
      <div className="soc-block soc-block--compact">
        <SocGauge soc={snap.soc} floor={chem.floorSoc} width={52} height={108} />
        <div className="soc-block__info">
          <div className="soc-block__value num">{snap.soc.toFixed(0)}%</div>
          <div className="soc-block__cap num">
            {((snap.soc / 100) * config.capacityAh).toFixed(0)} / {config.capacityAh} Ah
          </div>
          {forecastInfo && (
            <div className="soc-block__forecast num">
              → {forecastInfo.label}: {forecastInfo.soc.toFixed(0)}%
            </div>
          )}
          {belowFloor && <span className="chip chip--out chip--tiny">Below floor</span>}
        </div>
      </div>

      <div className="naa-config-row naa-config-row--tight">
        <span className="naa-config-row__label">
          <span>Start at 18:00</span>
          <span className="num">{config.startSoc}%</span>
        </span>
        <input
          className="naa-slider naa-slider--thin"
          type="range"
          min={chem.floorSoc}
          max={100}
          step={1}
          value={config.startSoc}
          onChange={(e) => setStartSoc(Number(e.target.value))}
          aria-label="Starting state of charge at 18:00"
        />
      </div>

      <div className="naa-config-pair">
        <div className="naa-config-row naa-config-row--tight">
          <span className="naa-config-row__label">Capacity</span>
          <Segmented options={CAPACITIES} value={config.capacityAh} onChange={setCapacity} format={(v) => `${v}`} />
        </div>
        <div className="naa-config-row naa-config-row--tight">
          <span className="naa-config-row__label">Chemistry</span>
          <Segmented options={CHEM_OPTIONS} value={config.chemistry} onChange={setChemistry} />
        </div>
      </div>
    </PanelCard>
  )
}
