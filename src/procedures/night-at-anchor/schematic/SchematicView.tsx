import { useSim, useSnapshot } from '../store'
import { DEVICES } from '../sim/devices'
import { CHEMISTRIES } from '../sim/battery'
import { SchematicGridLayer } from './SchematicGrid'
import { SchematicLessonPanel } from './SchematicLessonPanel'
import { SchematicTileIcon } from './SchematicTileIcon'
import { SchematicToggle } from './SchematicToggle'
import type { DeviceId, ElementId } from '../sim/types'

const W = 1280
const H = 860

const TILE_PAD = 16
const ROW_H = 20
const TOGGLE_W = 36
const TOGGLE_GAP = 8

const BATT_H = 112

const BATT = { x: 340, y: 228, w: 600, h: BATT_H }

const SOURCE_TILES: Array<{ id: ElementId; x: number; label: string; w: number }> = [
  { id: 'alternator', x: 64, label: 'Alternator', w: 228 },
  { id: 'solar', x: 468, label: 'Solar 200 W', w: 228 },
  { id: 'shore', x: 872, label: 'Shore power', w: 284 },
]
const SRC = { y: 48, h: TILE_PAD * 2 + ROW_H }

const DEV_COLS = [64, 468, 872]
const DEV_ROWS = [418, 492, 566, 640, 714, 788]

const DEV_TILE = { w: 272, h: TILE_PAD * 2 + ROW_H }

const devPos = (i: number) => ({ x: DEV_COLS[i % 3], y: DEV_ROWS[Math.floor(i / 3)] })

function tileRx(h: number) {
  return h / 2
}

function toggleX(tileW: number) {
  return tileW - TILE_PAD - TOGGLE_W
}

function rowControlsY(tileH: number) {
  return tileH / 2
}

function iconY(tileH: number) {
  return (tileH - ROW_H) / 2
}

function labelX() {
  return TILE_PAD + ROW_H + 10
}

function flowWidth(amps: number) {
  return Math.min(1.4 + Math.abs(amps) * 0.22, 6)
}

export function SchematicView() {
  const snap = useSnapshot()
  const config = useSim((s) => s.config)
  const selected = useSim((s) => s.selected)
  const select = useSim((s) => s.select)
  const toggleDevice = useSim((s) => s.toggleDevice)
  const setEngine = useSim((s) => s.setEngine)
  const setShorePower = useSim((s) => s.setShorePower)
  const lessonsOpen = useSim((s) => s.schematicLessonsOpen)
  const setLessonsOpen = useSim((s) => s.setSchematicLessonsOpen)
  const chem = CHEMISTRIES[config.chemistry]

  const charging = snap.battA > 0.05
  const socW = (BATT.w - 8) * (snap.soc / 100)
  const floorX = BATT.x + 4 + (BATT.w - 8) * (chem.floorSoc / 100)
  const belowFloor = snap.soc < chem.floorSoc
  const battRowY = BATT.y + BATT.h / 2
  const bankLabel = `${config.capacityAh} Ah ${chem.label} bank`

  const sourceAmps: Record<string, number> = {
    alternator: snap.altA,
    solar: snap.solarA,
    shore: snap.shoreA,
  }

  const tileSel = (id: ElementId) => (selected === id ? 'is-selected' : '')

  return (
    <div className="naa-schematic">
      <SchematicGridLayer />
      <div className="naa-schematic__diagram">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Energy flow schematic">
        <defs>
          <g id="yacht-outline">
            <path
              d="M40 120 Q200 90 420 95 Q560 98 640 120 Q500 160 340 160 Q160 158 40 120z M330 95 L330 -60 L500 88"
              fill="none"
              stroke="rgba(143,163,176,0.4)"
              strokeWidth="2"
            />
          </g>
        </defs>

        <g opacity={0.1} transform="translate(180, 360) scale(1.1)">
          <use href="#yacht-outline" />
        </g>

        {SOURCE_TILES.map((s) => {
          const a = sourceAmps[s.id] ?? 0
          const active = a > 0.1
          const x1 = s.x + s.w / 2
          const y1 = SRC.y + SRC.h
          const x2 = BATT.x + BATT.w / 2 + (s.x + s.w / 2 - W / 2) * 0.28
          const y2 = BATT.y
          const d = `M${x1},${y1} C${x1},${y1 + 62} ${x2},${y2 - 62} ${x2},${y2}`
          return (
            <g key={s.id}>
              <path d={d} fill="none" stroke="rgba(143,163,176,0.15)" strokeWidth={1.5} />
              {active && (
                <>
                  <path
                    d={d}
                    fill="none"
                    stroke="#5FD4C4"
                    strokeWidth={flowWidth(a)}
                    className="flow-line"
                    opacity={0.9}
                  />
                  <text
                    x={(x1 + x2) / 2 + 12}
                    y={(y1 + y2) / 2}
                    fontSize="13"
                    fontWeight="600"
                    fill="#5FD4C4"
                    className="num"
                  >
                    +{a.toFixed(1)} A
                  </text>
                </>
              )}
            </g>
          )
        })}

        {DEVICES.map((dev, i) => {
          const a = snap.loads[dev.id]
          const active = a > 0.05
          const p = devPos(i)
          const x1 = BATT.x + BATT.w / 2 + (p.x + DEV_TILE.w / 2 - W / 2) * 0.22
          const y1 = BATT.y + BATT.h
          const x2 = p.x + DEV_TILE.w / 2
          const y2 = p.y
          const d = `M${x1},${y1} C${x1},${y1 + 52} ${x2},${y2 - 52} ${x2},${y2}`
          return (
            <g key={dev.id}>
              <path d={d} fill="none" stroke="rgba(143,163,176,0.12)" strokeWidth={1.2} />
              {active && (
                <path d={d} fill="none" stroke="#F0A35E" strokeWidth={flowWidth(a)} className="flow-line" opacity={0.85} />
              )}
            </g>
          )
        })}

        {SOURCE_TILES.map((s) => {
          const a = sourceAmps[s.id] ?? 0
          const active = a > 0.1
          const srcToggleX = toggleX(s.w)
          const srcRowY = rowControlsY(SRC.h)
          const sourceOff =
            (s.id === 'alternator' && !config.engineOn) || (s.id === 'shore' && !config.shorePowerOn)
          const ampsLabel =
            s.id === 'alternator' && !config.engineOn
              ? 'engine off'
              : s.id === 'shore' && !config.shorePowerOn
                ? 'disconnected'
                : active
                  ? `${a.toFixed(1)} A`
                  : 'idle'
          return (
            <g
              key={s.id}
              transform={`translate(${s.x}, ${SRC.y})`}
              className={`schem-tile ${tileSel(s.id)}`}
              opacity={sourceOff && !active ? 0.45 : 1}
              onClick={() => select(selected === s.id ? null : s.id)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                width={s.w}
                height={SRC.h}
                rx={tileRx(SRC.h)}
                fill="rgba(22,34,46,0.82)"
                stroke={selected === s.id ? 'rgba(95,212,196,0.6)' : 'rgba(241,241,241,0.12)'}
              />
              <SchematicTileIcon
                id={s.id}
                x={TILE_PAD}
                y={iconY(SRC.h)}
                tone={active ? 'in' : sourceOff ? 'muted' : 'default'}
              />
              <text x={labelX()} y={srcRowY} fontSize="14" fontWeight="600" fill="#F1F1F1" dominantBaseline="middle">
                {s.label}
              </text>
              <text
                x={s.id === 'solar' ? s.w - TILE_PAD : srcToggleX - TOGGLE_GAP}
                y={srcRowY}
                fontSize="12"
                fill={active ? '#5FD4C4' : '#8FA3B0'}
                className="num"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {ampsLabel}
              </text>
              {s.id === 'alternator' && (
                <SchematicToggle
                  x={srcToggleX}
                  y={iconY(SRC.h)}
                  on={config.engineOn}
                  variant="source"
                  label="Engine"
                  onToggle={() => {
                    setEngine(!config.engineOn)
                    select('alternator')
                  }}
                />
              )}
              {s.id === 'shore' && (
                <SchematicToggle
                  x={srcToggleX}
                  y={iconY(SRC.h)}
                  on={config.shorePowerOn}
                  variant="source"
                  label="Shore power"
                  onToggle={() => {
                    setShorePower(!config.shorePowerOn)
                    select('shore')
                  }}
                />
              )}
              {active && s.id === 'solar' && (
                <circle cx={s.w - TILE_PAD} cy={srcRowY - 14} r={4} fill="#5FD4C4" className="schem-pulse" />
              )}
            </g>
          )
        })}

        <g
          className={`schem-tile ${tileSel('battery')}`}
          onClick={() => select(selected === 'battery' ? null : 'battery')}
          style={{ cursor: 'pointer' }}
        >
          <rect
            x={BATT.x}
            y={BATT.y}
            width={BATT.w}
            height={BATT.h}
            rx={tileRx(BATT.h)}
            fill="rgba(22,34,46,0.85)"
            stroke={selected === 'battery' ? 'rgba(95,212,196,0.6)' : 'rgba(241,241,241,0.14)'}
            strokeWidth={1.2}
          />
          <clipPath id="batt-clip">
            <rect x={BATT.x + 4} y={BATT.y + 4} width={BATT.w - 8} height={BATT.h - 8} rx={tileRx(BATT.h - 8)} />
          </clipPath>
          <g clipPath="url(#batt-clip)">
            <rect
              x={BATT.x + 4}
              y={BATT.y + 4}
              width={socW}
              height={BATT.h - 8}
              fill={belowFloor ? '#E2654E' : '#5FD4C4'}
              opacity={0.28}
              style={{ transition: 'width 0.3s ease' }}
            />
            <rect x={BATT.x + 4 + socW - 2} y={BATT.y + 4} width={3} height={BATT.h - 8} fill={belowFloor ? '#E2654E' : '#5FD4C4'} />
          </g>
          <line x1={floorX} x2={floorX} y1={BATT.y - 8} y2={BATT.y + BATT.h + 8} stroke="#E2654E" strokeWidth={1.5} strokeDasharray="5 4" />
          <text x={floorX + 6} y={BATT.y - 12} fontSize="11" fill="#E2654E">
            {chem.floorSoc}% {config.chemistry === 'AGM' ? 'lead-acid floor' : 'LiFePO4 floor'}
          </text>

          <SchematicTileIcon
            id="battery"
            x={BATT.x + TILE_PAD}
            y={BATT.y + iconY(BATT.h)}
            tone={charging ? 'in' : belowFloor ? 'out' : 'default'}
          />

          <text x={BATT.x + labelX()} y={battRowY} dominantBaseline="middle">
            <tspan fontSize="24" fontWeight="600" fill="#F1F1F1" className="num">
              {snap.soc.toFixed(0)}%{' '}
            </tspan>
            <tspan fontSize="13" fill="#8FA3B0" className="num">
              {bankLabel}
            </tspan>
          </text>

          <text
            x={BATT.x + BATT.w - TILE_PAD}
            y={battRowY}
            textAnchor="end"
            dominantBaseline="middle"
            className="num"
          >
            <tspan fontSize="15" fontWeight="600" fill={charging ? '#5FD4C4' : '#F0A35E'}>
              {snap.battA >= 0 ? '+' : '−'}
              {Math.abs(snap.battA).toFixed(1)} A
            </tspan>
            {snap.phase && (
              <tspan fontSize="11" fill="#5FD4C4" dx="10" letterSpacing="0.06em">
                {snap.phase.toUpperCase()}
              </tspan>
            )}
          </text>
        </g>

        {DEVICES.map((dev, i) => {
          const p = devPos(i)
          const enabled = config.devicesEnabled[dev.id]
          const a = snap.loads[dev.id]
          const active = a > 0.05
          const devToggleX = toggleX(DEV_TILE.w)
          const devRowY = rowControlsY(DEV_TILE.h)
          const ampsLabel = !enabled ? 'off' : active ? `${a.toFixed(1)} A` : 'idle'
          return (
            <g
              key={dev.id}
              transform={`translate(${p.x}, ${p.y})`}
              className={`schem-tile ${tileSel(dev.id as DeviceId)}`}
              opacity={enabled ? 1 : 0.4}
              onClick={() => select(selected === dev.id ? null : dev.id)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                width={DEV_TILE.w}
                height={DEV_TILE.h}
                rx={tileRx(DEV_TILE.h)}
                fill="rgba(22,34,46,0.82)"
                stroke={selected === dev.id ? 'rgba(95,212,196,0.6)' : active ? 'rgba(240,163,94,0.4)' : 'rgba(241,241,241,0.1)'}
              />
              <SchematicTileIcon
                id={dev.id}
                x={TILE_PAD}
                y={iconY(DEV_TILE.h)}
                tone={active ? 'out' : enabled ? 'default' : 'muted'}
              />
              <text x={labelX()} y={devRowY} fontSize="13" fontWeight="600" fill="#F1F1F1" dominantBaseline="middle">
                {dev.name}
              </text>
              <text
                x={devToggleX - TOGGLE_GAP}
                y={devRowY}
                fontSize="12"
                fill={active ? '#F0A35E' : '#8FA3B0'}
                className="num"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {ampsLabel}
              </text>
              <SchematicToggle
                x={devToggleX}
                y={iconY(DEV_TILE.h)}
                on={enabled}
                label={dev.name}
                onToggle={() => {
                  toggleDevice(dev.id)
                  select(dev.id)
                }}
              />
            </g>
          )
        })}
        </svg>
      </div>

      {lessonsOpen && (
        <aside className="naa-schematic__aside" aria-label="Lessons">
          <SchematicLessonPanel onHide={() => setLessonsOpen(false)} />
        </aside>
      )}
    </div>
  )
}
