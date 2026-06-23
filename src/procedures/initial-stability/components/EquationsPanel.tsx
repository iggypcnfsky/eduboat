import { useStability } from '../store'

function fmt(n: number, d = 3) {
  return Number.isFinite(n) ? n.toFixed(d) : '—'
}

export function EquationsPanel() {
  const snapshot = useStability((s) => s.snapshot)
  const config = useStability((s) => s.config)

  if (!snapshot.ok) {
    return (
      <div className="is-panel-inner">
        <p className="is-field__hint">{snapshot.error}</p>
      </div>
    )
  }

  const thetaRad = snapshot.heelRad
  const sinT = Math.sin(thetaRad)

  return (
    <div className="is-panel-inner">
      <div className="is-eq">
        <div className="is-eq__formula">MR(θ) = Δ × GZ(θ)</div>
        <div className="is-eq__values">
          {fmt(snapshot.mr, 2)} kN·m = {fmt(snapshot.displacementKg, 0)} kg × {fmt(snapshot.gz, 4)} m × g
        </div>
      </div>

      <div className="is-eq">
        <div className="is-eq__formula">GZ(θ) ≈ GM × sin(θ)</div>
        <div className="is-eq__values">
          {fmt(snapshot.gz, 4)} m ≈ {fmt(snapshot.gmUpright, 3)} × {fmt(sinT, 4)} = {fmt(snapshot.gzApprox, 4)} m
        </div>
        <div className="is-eq__error">
          Approximation error: {fmt(snapshot.approxErrorPct, 1)}%
          {Math.abs(config.heelDeg) < 2 && ' — near upright, GM·sin(θ) ≈ 0 so % error is not meaningful'}
          {Math.abs(config.heelDeg) >= 2 &&
            snapshot.approxErrorPct > 5 &&
            ' — GM·sin(θ) diverges at large θ'}
        </div>
      </div>

      <div className="is-eq">
        <div className="is-eq__formula">GM = KB + BM − KG</div>
        <div className="is-eq__values">
          <span className="is-eq__shape">{fmt(snapshot.kbUpright, 3)}</span>
          {' + '}
          <span className="is-eq__shape">{fmt(snapshot.bmUpright, 3)}</span>
          {' − '}
          <span className="is-eq__weight">{fmt(snapshot.kg, 3)}</span>
          {' = '}
          <strong>{fmt(snapshot.gmUpright, 3)} m</strong>
        </div>
        <div className="is-eq__legend">
          <span className="is-eq__shape">KB, BM = hull shape & computed displacement</span>
          <span className="is-eq__weight">KG = weight slider &amp; keel type</span>
        </div>
      </div>

      <div className="is-eq is-eq--small">
        <div className="is-eq__formula">BM = I / ∇</div>
        <div className="is-eq__values">
          At θ={config.heelDeg.toFixed(1)}°: BM = {fmt(snapshot.bm, 3)} m
        </div>
      </div>
    </div>
  )
}

export function ValueReadout() {
  const snapshot = useStability((s) => s.snapshot)

  if (!snapshot.ok) return null

  const rows = [
    ['KB', `${snapshot.kb.toFixed(3)} m`, 'shape'],
    ['BM', `${snapshot.bm.toFixed(3)} m`, 'shape'],
    ['KG', `${snapshot.kg.toFixed(3)} m`, 'weight'],
    ['GM (upright)', `${snapshot.gmUpright.toFixed(3)} m`, ''],
    ['GZ (now)', `${snapshot.gz.toFixed(4)} m`, ''],
    ['MR', `${snapshot.mr.toFixed(2)} kN·m`, ''],
    ['Δ (float)', `${snapshot.displacementKg.toFixed(0)} kg`, ''],
    ['Total weight', `${snapshot.totalBoatMassKg.toFixed(0)} kg (${(snapshot.totalBoatMassKg / 1000).toFixed(2)} t)`, 'weight'],
  ] as const

  return (
    <div className="is-readout is-readout--window">
      <h4 className="is-readout__title sr-only">Live values</h4>
      <dl className="is-readout__grid">
        {rows.map(([k, v, kind]) => (
          <div key={k} className="is-readout__row">
            <dt className={kind ? `is-readout__k is-readout__k--${kind}` : 'is-readout__k'}>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
