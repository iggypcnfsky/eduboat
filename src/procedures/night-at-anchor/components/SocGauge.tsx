/** Vertical battery-tank SOC gauge with the chemistry floor line. */
export function SocGauge({
  soc,
  floor,
  width = 56,
  height = 132,
}: {
  soc: number
  floor: number
  width?: number
  height?: number
}) {
  const pad = 4
  const innerH = height - pad * 2
  const fillH = (innerH * soc) / 100
  const floorY = pad + innerH * (1 - floor / 100)
  const belowFloor = soc < floor
  const fillColor = belowFloor ? '#E2654E' : '#5FD4C4'

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label={`State of charge ${Math.round(soc)} percent`}>
      <rect
        x={1}
        y={1}
        width={width - 2}
        height={height - 2}
        rx={14}
        fill="rgba(10,20,31,0.5)"
        stroke="rgba(241,241,241,0.14)"
      />
      <clipPath id="soc-clip">
        <rect x={pad} y={pad} width={width - pad * 2} height={innerH} rx={10} />
      </clipPath>
      <g clipPath="url(#soc-clip)">
        <rect
          x={pad}
          y={pad + innerH - fillH}
          width={width - pad * 2}
          height={fillH}
          fill={fillColor}
          opacity={0.85}
          style={{ transition: 'height 0.3s ease, y 0.3s ease' }}
        />
        <rect x={pad} y={pad + innerH - fillH} width={width - pad * 2} height={2.5} fill="#F1F1F1" opacity={0.85} />
      </g>
      {/* chemistry floor line */}
      <line x1={2} x2={width - 2} y1={floorY} y2={floorY} stroke="#E2654E" strokeWidth={1.5} strokeDasharray="4 3" />
    </svg>
  )
}
