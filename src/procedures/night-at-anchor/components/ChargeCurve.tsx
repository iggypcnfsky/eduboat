import { useMemo } from 'react'
import type { SimConfig, Snapshot } from '../sim/types'
import { step } from '../sim/engine'
import { CHEMISTRIES } from '../sim/battery'

const PHASE_COLOR: Record<string, string> = {
  bulk: '#5FD4C4',
  absorption: '#E8B25A',
  float: '#6FBF9A',
}

/**
 * Live charging-curve chart: simulates charging from the given snapshot
 * with the engine on and plots charge current over time, segmented into
 * bulk / absorption / float. After "Energy Unlimited" (Victron), ch. 4.
 */
export function ChargeCurve({
  from,
  config,
  hours = 6,
  width = 420,
  height = 150,
}: {
  from: Snapshot
  config: SimConfig
  hours?: number
  width?: number
  height?: number
}) {
  const data = useMemo(() => {
    const cfg: SimConfig = { ...config, engineOn: true }
    let s: Snapshot = { ...from }
    const pts: Array<{ t: number; a: number; phase: string | null }> = []
    const total = hours * 60
    for (let i = 0; i <= total; i += 3) {
      pts.push({ t: i, a: Math.max(s.battA, 0), phase: s.phase })
      for (let k = 0; k < 3; k++) s = step(s, cfg)
    }
    return pts
  }, [from, config, hours])

  const padL = 34
  const padB = 22
  const padT = 14
  const plotW = width - padL - 8
  const plotH = height - padT - padB
  const maxA = Math.max(10, ...data.map((d) => d.a)) * 1.1

  const x = (t: number) => padL + (t / (hours * 60)) * plotW
  const y = (a: number) => padT + plotH * (1 - a / maxA)

  // Phase boundaries for region shading
  const regions: Array<{ from: number; to: number; phase: string }> = []
  let regionStart = 0
  let current = data[0]?.phase ?? null
  for (let i = 1; i < data.length; i++) {
    if (data[i].phase !== current) {
      if (current) regions.push({ from: regionStart, to: data[i].t, phase: current })
      regionStart = data[i].t
      current = data[i].phase
    }
  }
  if (current) regions.push({ from: regionStart, to: hours * 60, phase: current })

  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(d.t).toFixed(1)},${y(d.a).toFixed(1)}`).join(' ')
  const absStart = CHEMISTRIES[config.chemistry].absorptionStartSoc

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {regions.map((r, i) => (
        <g key={i}>
          <rect
            x={x(r.from)}
            y={padT}
            width={Math.max(x(r.to) - x(r.from), 0)}
            height={plotH}
            fill={PHASE_COLOR[r.phase]}
            opacity={0.07}
          />
          {x(r.to) - x(r.from) > 46 && (
            <text
              x={(x(r.from) + x(r.to)) / 2}
              y={padT + 12}
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="600"
              fill={PHASE_COLOR[r.phase]}
              style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
            >
              {r.phase}
            </text>
          )}
        </g>
      ))}

      {/* axes */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="rgba(143,163,176,0.3)" />
      <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="rgba(143,163,176,0.3)" />
      <text x={6} y={padT + 8} fontSize="9" fill="#8FA3B0">
        A
      </text>
      <text x={padL - 4} y={y(maxA / 1.1) + 3} fontSize="9" fill="#8FA3B0" textAnchor="end" className="num">
        {Math.round(maxA / 1.1)}
      </text>
      {[0, 2, 4, 6].filter((h) => h <= hours).map((h) => (
        <text key={h} x={x(h * 60)} y={height - 6} fontSize="9" fill="#8FA3B0" textAnchor="middle" className="num">
          {h}h
        </text>
      ))}

      {/* the curve */}
      <path d={path} fill="none" stroke="#5FD4C4" strokeWidth="2" strokeLinejoin="round" />
      {/* "you are here" */}
      <circle cx={x(0)} cy={y(data[0]?.a ?? 0)} r="4" fill="#F1F1F1" stroke="#5FD4C4" strokeWidth="2" />

      <text x={padL + plotW} y={padT + plotH - 6} fontSize="9.5" fill="#8FA3B0" textAnchor="end">
        absorption starts ~{absStart}% SOC
      </text>
    </svg>
  )
}
