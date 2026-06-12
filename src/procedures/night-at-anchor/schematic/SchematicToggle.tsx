/** Mini toggle switch drawn in SVG — matches app Toggle styling. */
export function SchematicToggle({
  x,
  y,
  on,
  disabled = false,
  variant = 'load',
  label,
  onToggle,
}: {
  x: number
  y: number
  on: boolean
  disabled?: boolean
  variant?: 'load' | 'source'
  label: string
  onToggle?: () => void
}) {
  const w = 36
  const h = 20
  const r = 7
  const cy = y + h / 2
  const knobX = on ? x + w - r - 3 : x + r + 3

  const trackOn = variant === 'source' ? 'rgba(95,212,196,0.35)' : 'rgba(240,163,94,0.35)'
  const knobOn = variant === 'source' ? '#5FD4C4' : '#F0A35E'

  return (
    <g
      className={`schem-toggle${on ? ' is-on' : ''}${disabled ? ' is-disabled' : ''}${variant === 'source' ? ' is-source' : ''}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
      aria-disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onToggle?.()
      }}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={h / 2}
        fill={on ? trackOn : 'rgba(143,163,176,0.25)'}
        stroke="rgba(241,241,241,0.14)"
      />
      <circle cx={knobX} cy={cy} r={r} fill={on ? knobOn : '#8FA3B0'} opacity={disabled ? 0.55 : 1} />
    </g>
  )
}
