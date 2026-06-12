import { useSim } from '../store'
import { BatteryPanel } from './BatteryPanel'
import { ChargeCurvePanel } from './ChargeCurvePanel'
import { DevicesPanel } from './DevicesPanel'
import { EnginePanel } from './EnginePanel'
import { EnergyInPanel } from './EnergyInPanel'
import { EnergyOutPanel } from './EnergyOutPanel'

/** Left: devices · Right: battery → energy flow → charge curve (schematic) → engine. */
export function SideRails() {
  const sheet = useSim((s) => s.sheet)
  const view = useSim((s) => s.view)

  return (
    <>
      <aside className={`naa-rail naa-rail--left ${sheet === 'setup' ? 'is-open' : ''}`}>
        <DevicesPanel />
      </aside>

      <aside className={`naa-rail naa-rail--right ${sheet === 'energy' ? 'is-open' : ''}`}>
        <BatteryPanel />
        <div className="naa-energy-row">
          <EnergyInPanel />
          <EnergyOutPanel />
        </div>
        {view === 'schematic' && <ChargeCurvePanel />}
        <EnginePanel />
      </aside>
    </>
  )
}
