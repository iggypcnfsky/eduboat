import { TrendingUp } from 'lucide-react'
import { useSim, useSnapshot } from '../store'
import { CHEMISTRIES } from '../sim/battery'
import { ChargeCurve } from './ChargeCurve'
import { PanelCard } from './PanelCard'

const PHASE_LABEL = { bulk: 'Bulk', absorption: 'Absorption', float: 'Float' } as const

/** Live charge-curve — shown on the right rail in Schematic view. */
export function ChargeCurvePanel() {
  const snap = useSnapshot()
  const config = useSim((s) => s.config)
  const chem = CHEMISTRIES[config.chemistry]
  const charging = snap.battA > 0.05

  return (
    <PanelCard
      title="Charge curve"
      icon={<TrendingUp size={16} strokeWidth={1.75} className="flow-icon flow-icon--in" />}
      className="naa-card--curve"
    >
      {snap.phase && charging && (
        <span className="chip chip--in chip--tiny naa-curve__phase">{PHASE_LABEL[snap.phase]}</span>
      )}

      <ChargeCurve from={snap} config={config} width={300} height={128} hours={6} />

      <p className="naa-note naa-curve__note">
        Engine on from <span className="num">{snap.soc.toFixed(0)}%</span>: bulk to ~
        {chem.absorptionStartSoc}% SOC, then absorption tapers.
      </p>
    </PanelCard>
  )
}
