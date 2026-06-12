import { useSim, useSnapshot } from '../store'
import { formatTod } from '../sim/engine'
import { PanelCard } from './PanelCard'
import { AltInIcon, BankFlowIcon, EnergyInIcon, SolarInIcon } from './EnergyIcons'

const PHASE_LABEL = { bulk: 'Bulk', absorption: 'Abs', float: 'Float' } as const

export function EnergyInPanel() {
  const snap = useSnapshot()
  const config = useSim((s) => s.config)
  const net = snap.battA
  const charging = net > 0.05
  const sourceIn = snap.solarA + snap.altA + snap.shoreA
  const outOfFuel = config.engineOn && snap.fuelL <= 0

  return (
    <PanelCard title="Battery in" icon={<EnergyInIcon />} className="naa-card--flow">
      <p className="flow-time num">{formatTod(snap.minute)}</p>
      <ul className="flow-metrics">
        <li className="flow-metric">
          <SolarInIcon />
          <span className="flow-metric__label">Solar</span>
          <span className={`flow-metric__value num ${snap.solarA > 0.1 ? 'is-in' : ''}`}>
            +{snap.solarA.toFixed(1)} A
          </span>
        </li>
        <li className="flow-metric">
          <AltInIcon />
          <span className="flow-metric__label">Alt</span>
          <span className={`flow-metric__value num ${snap.altA > 0 ? 'is-in' : ''}`}>
            +{snap.altA.toFixed(0)} A
          </span>
        </li>
        <li className="flow-metric">
          <AltInIcon />
          <span className="flow-metric__label">Shore</span>
          <span className={`flow-metric__value num ${snap.shoreA > 0 ? 'is-in' : ''}`}>
            +{snap.shoreA.toFixed(0)} A
          </span>
        </li>
        <li className="flow-metric">
          <BankFlowIcon direction="in" />
          <span className="flow-metric__label">Bank</span>
          <span className={`flow-metric__value num ${charging ? 'is-in' : ''}`}>
            +{Math.max(net, 0).toFixed(1)} A
          </span>
        </li>
      </ul>
      <div className="flow-footer">
        <span className="flow-footer__label">Today</span>
        <span className="flow-footer__value num is-in">+{snap.ahIn.toFixed(0)} Ah</span>
      </div>
      {(snap.phase || outOfFuel) && (
        <div className="flow-chips">
          {snap.phase && <span className="chip chip--in chip--tiny">{PHASE_LABEL[snap.phase]}</span>}
          {outOfFuel && <span className="chip chip--out chip--tiny">No fuel</span>}
        </div>
      )}
      {sourceIn > 0.1 && (
        <div className="flow-total num is-in">Σ +{sourceIn.toFixed(1)} A</div>
      )}
    </PanelCard>
  )
}
