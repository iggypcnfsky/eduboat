import { useMemo } from 'react'
import { chartGzOrdinate } from '../sim/gz-curve'
import { useStability } from '../store'

const W = 360
const H = 160
const PAD = { t: 16, r: 12, b: 28, l: 36 }
const HEEL_MIN = -180
const HEEL_MAX = 180

export function GzCurveChart() {
  const gzCurve = useStability((s) => s.gzCurve)
  const config = useStability((s) => s.config)
  const snapshot = useStability((s) => s.snapshot)

  const { pathTrue, pathApprox, marker, yZero, xZero, labels } = useMemo(() => {
    const pts = gzCurve.points
    if (pts.length === 0) {
      return {
        pathTrue: '',
        pathApprox: '',
        marker: null,
        yZero: H / 2,
        xZero: W / 2,
        labels: [] as { deg: number; x: number }[],
      }
    }

    const chartValues = pts.flatMap((p) => [chartGzOrdinate(p.heelDeg, p.gz)])
    const maxAbs = Math.max(
      0.05,
      ...chartValues.map(Math.abs),
      ...pts.map((p) => Math.abs(p.gzApprox)),
      Math.abs(gzCurve.maxGz),
    )
    const plotW = W - PAD.l - PAD.r
    const plotH = H - PAD.t - PAD.b

    const xScale = (deg: number) =>
      PAD.l + ((deg - HEEL_MIN) / (HEEL_MAX - HEEL_MIN)) * plotW
    const yScale = (gz: number) => PAD.t + plotH / 2 - (gz / maxAbs) * (plotH / 2)

    const pathTrue = pts
      .map(
        (p, i) =>
          `${i === 0 ? 'M' : 'L'} ${xScale(p.heelDeg).toFixed(1)} ${yScale(chartGzOrdinate(p.heelDeg, p.gz)).toFixed(1)}`,
      )
      .join(' ')
    const pathApprox = pts
      .map((p, i) => {
        const approxOrd = Math.abs(p.gzApprox)
        return `${i === 0 ? 'M' : 'L'} ${xScale(p.heelDeg).toFixed(1)} ${yScale(approxOrd).toFixed(1)}`
      })
      .join(' ')

    const heelClamped = Math.max(HEEL_MIN, Math.min(HEEL_MAX, config.heelDeg))
    const markerGz = snapshot.ok ? chartGzOrdinate(heelClamped, snapshot.gz) : 0
    const marker = {
      x: xScale(heelClamped),
      y: yScale(markerGz),
    }

    const yZero = yScale(0)
    const xZero = xScale(0)
    const labels = [-180, -90, 0, 90, 180].map((deg) => ({ deg, x: xScale(deg) }))

    return { pathTrue, pathApprox, marker, yZero, xZero, labels }
  }, [gzCurve, config.heelDeg, snapshot])

  const maxLabel = `${Math.abs(gzCurve.maxGzAtDeg)}°`

  return (
    <div className="is-gz-chart is-gz-chart--window">
      <h4 className="is-gz-chart__title sr-only">GZ curve</h4>
      <svg viewBox={`0 0 ${W} ${H}`} className="is-gz-chart__svg" preserveAspectRatio="xMidYMid meet">
        <line x1={PAD.l} y1={yZero} x2={W - PAD.r} y2={yZero} stroke="rgba(241,241,241,0.15)" strokeWidth={1} />
        <line
          x1={xZero}
          y1={PAD.t}
          x2={xZero}
          y2={H - PAD.b}
          stroke="rgba(241,241,241,0.1)"
          strokeWidth={1}
        />

        {labels.map(({ deg, x }) => (
          <g key={deg}>
            <line x1={x} y1={PAD.t} x2={x} y2={H - PAD.b} stroke="rgba(241,241,241,0.06)" strokeWidth={1} />
            <text x={x} y={H - 6} fill="#8fa3b0" fontSize={9} textAnchor="middle">
              {deg}°
            </text>
          </g>
        ))}

        <path d={pathApprox} fill="none" stroke="rgba(240,163,94,0.55)" strokeWidth={1.5} strokeDasharray="5 4" />
        <path d={pathTrue} fill="none" stroke="#5fd4c4" strokeWidth={2} />

        {marker && (
          <circle cx={marker.x} cy={marker.y} r={4} fill="#f0a35e" stroke="#0a141f" strokeWidth={1} />
        )}

        {gzCurve.vanishingStabilityDeg !== null && (
          <text x={PAD.l} y={PAD.t + 10} fill="#8fa3b0" fontSize={9}>
            AVS ≈ {gzCurve.vanishingStabilityDeg}°
          </text>
        )}

        {gzCurve.maxGz > 0 && (
          <text x={W - PAD.r} y={PAD.t + 10} fill="#8fa3b0" fontSize={9} textAnchor="end">
            max GZ {gzCurve.maxGz.toFixed(3)} m @ {maxLabel}
          </text>
        )}
      </svg>
      <div className="is-gz-chart__legend">
        <span className="is-gz-chart__leg is-gz-chart__leg--true">GZ(θ)</span>
        <span className="is-gz-chart__leg is-gz-chart__leg--approx">GM·sin(θ)</span>
        <span className="is-gz-chart__leg is-gz-chart__leg--hint">← port · starboard →</span>
      </div>
    </div>
  )
}
