import { useSnapshot } from '../store'
import { formatTod } from '../sim/engine'
import { PanelCard } from './PanelCard'
import { BankFlowIcon, EnergyOutIcon, LoadOutIcon } from './EnergyIcons'

export function EnergyOutPanel() {
  const snap = useSnapshot()
  const net = snap.battA
  const discharging = net < -0.05

  return (
    <PanelCard title="Battery out" icon={<EnergyOutIcon />} className="naa-card--flow">
      <p className="flow-time num">{formatTod(snap.minute)}</p>
      <ul className="flow-metrics">
        <li className="flow-metric">
          <LoadOutIcon />
          <span className="flow-metric__label">Loads</span>
          <span className="flow-metric__value num is-out">−{snap.loadA.toFixed(1)} A</span>
        </li>
        <li className="flow-metric">
          <BankFlowIcon direction="out" />
          <span className="flow-metric__label">Bank</span>
          <span className={`flow-metric__value num ${discharging ? 'is-out' : ''}`}>
            −{Math.max(-net, 0).toFixed(1)} A
          </span>
        </li>
        <li className="flow-metric">
          <EnergyOutIcon />
          <span className="flow-metric__label">Net</span>
          <span className={`flow-metric__value num ${discharging ? 'is-out' : net > 0.05 ? 'is-in' : ''}`}>
            {net >= 0 ? '+' : '−'}
            {Math.abs(net).toFixed(1)} A
          </span>
        </li>
      </ul>
      <div className="flow-footer">
        <span className="flow-footer__label">Today</span>
        <span className="flow-footer__value num is-out">−{snap.ahOut.toFixed(0)} Ah</span>
      </div>
      {!snap.phase && discharging && (
        <div className="flow-chips">
          <span className="chip chip--out chip--tiny">Discharging</span>
        </div>
      )}
    </PanelCard>
  )
}
