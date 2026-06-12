/** Full-bleed top-down reference grid — three scales + plus marks at coarse intersections. */

const LEVELS = [
  { id: 'fine', step: 20, stroke: 'rgba(140, 199, 230, 0.07)', width: 0.5 },
  { id: 'medium', step: 80, stroke: 'rgba(140, 199, 230, 0.13)', width: 0.75 },
  { id: 'coarse', step: 320, stroke: 'rgba(140, 199, 230, 0.2)', width: 1 },
] as const

const COARSE = LEVELS[2]
const PLUS_STROKE = 'rgba(140, 199, 230, 0.32)'
const PLUS_ARM = 5

export function SchematicGridLayer() {
  return (
    <svg className="naa-schematic__grid" aria-hidden preserveAspectRatio="none">
      <defs>
        {LEVELS.slice(0, 2).map((level) => (
          <pattern
            key={level.id}
            id={`schem-grid-${level.id}`}
            width={level.step}
            height={level.step}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${level.step} 0 L 0 0 0 ${level.step}`}
              fill="none"
              stroke={level.stroke}
              strokeWidth={level.width}
            />
          </pattern>
        ))}
        <pattern
          id="schem-grid-coarse"
          width={COARSE.step}
          height={COARSE.step}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${COARSE.step} 0 L 0 0 0 ${COARSE.step}`}
            fill="none"
            stroke={COARSE.stroke}
            strokeWidth={COARSE.width}
          />
          <g stroke={PLUS_STROKE} strokeWidth={1} strokeLinecap="round">
            <line x1={-PLUS_ARM} y1={0} x2={PLUS_ARM} y2={0} />
            <line x1={0} y1={-PLUS_ARM} x2={0} y2={PLUS_ARM} />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#schem-grid-fine)" />
      <rect width="100%" height="100%" fill="url(#schem-grid-medium)" />
      <rect width="100%" height="100%" fill="url(#schem-grid-coarse)" />
    </svg>
  )
}
