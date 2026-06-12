import { Html } from '@react-three/drei'
import { ANCHORS } from './anchors'
import { HotspotIcon } from './HotspotIcon'
import { DEVICES, DEVICE_MAP } from '../sim/devices'
import { useSim, useSnapshot } from '../store'
import type { DeviceId, ElementId } from '../sim/types'

/** Nudge icons outward from the hull so they don't stack on deck hardware. */
const ICON_NUDGE: Partial<Record<ElementId, [number, number, number]>> = {
  battery: [0, 0.35, 0.55],
  fridge: [0, 0.25, -0.45],
  plotter: [0, 0.3, 0.55],
  vhf: [0, 0.2, -0.5],
  usb: [0, 0.15, -0.5],
  cabinLights: [0, 0.45, 0.45],
  waterPump: [0, 0.2, 0.45],
  heater: [0, 0.25, 0.55],
  anchorLight: [0, 0.5, 0.35],
  alternator: [0, 0.2, 0.5],
  solar: [0, 0.35, 0.55],
  shore: [0, 0.2, 0.55],
}

const DEVICE_IDS = new Set<string>(DEVICES.map((d) => d.id))

function iconPosition(id: ElementId): [number, number, number] {
  const a = ANCHORS[id]
  const n = ICON_NUDGE[id] ?? [0, 0.2, 0.45]
  return [a[0] + n[0], a[1] + n[1], a[2] + n[2]]
}

function Hotspot({ id }: { id: ElementId }) {
  const snap = useSnapshot()
  const config = useSim((s) => s.config)
  const selected = useSim((s) => s.selected)
  const select = useSim((s) => s.select)
  const toggleDevice = useSim((s) => s.toggleDevice)
  const setEngine = useSim((s) => s.setEngine)
  const setShorePower = useSim((s) => s.setShorePower)

  let name: string
  let tone: 'in' | 'out' | 'idle' = 'idle'
  let detail: string | null = null
  let enabled = true

  if (id === 'battery') {
    name = 'Battery bank'
    tone = snap.battA > 0.05 ? 'in' : snap.battA < -0.05 ? 'out' : 'idle'
    detail = `${snap.soc.toFixed(0)}%`
  } else if (id === 'alternator') {
    name = 'Alternator'
    enabled = config.engineOn
    tone = enabled && snap.altA > 0.1 ? 'in' : 'idle'
    detail = enabled && snap.altA > 0.1 ? `+${snap.altA.toFixed(0)} A` : null
  } else if (id === 'solar') {
    name = 'Solar 200 W'
    tone = snap.solarA > 0.1 ? 'in' : 'idle'
    detail = snap.solarA > 0.1 ? `+${snap.solarA.toFixed(1)} A` : null
  } else if (id === 'shore') {
    name = 'Shore power'
    enabled = config.shorePowerOn
    tone = enabled && snap.shoreA > 0.1 ? 'in' : 'idle'
    detail = enabled && snap.shoreA > 0.1 ? `+${snap.shoreA.toFixed(0)} A` : null
  } else if (DEVICE_IDS.has(id)) {
    const dev = DEVICE_MAP[id as DeviceId]
    name = dev.name
    enabled = config.devicesEnabled[id as DeviceId]
    const a = snap.loads[id as DeviceId]
    tone = enabled && a > 0.05 ? 'out' : 'idle'
    detail = enabled && a > 0.05 ? `−${a.toFixed(1)} A` : null
  } else {
    name = id
  }

  const drawing = enabled && tone !== 'idle'
  const isSelected = selected === id
  const isDevice = DEVICE_IDS.has(id)
  const canToggle = id === 'alternator' || id === 'shore' || isDevice

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (id === 'alternator') {
      setEngine(!config.engineOn)
      select(id)
      return
    }
    if (id === 'shore') {
      setShorePower(!config.shorePowerOn)
      select(id)
      return
    }
    if (isDevice) {
      toggleDevice(id as DeviceId)
      select(id)
      return
    }
    select(isSelected ? null : id)
  }

  const title = canToggle
    ? `${name} — click to ${enabled ? 'turn off' : 'turn on'}`
    : enabled
      ? name
      : `${name} — off`

  return (
    <group position={iconPosition(id)}>
      <Html center distanceFactor={16} zIndexRange={[15, 0]} style={{ pointerEvents: 'auto' }}>
        <button
          type="button"
          title={title}
          className={`hotspot hotspot--${tone} ${drawing ? 'is-active' : ''} ${!enabled ? 'is-disabled' : ''} ${isSelected ? 'is-selected' : ''}`}
          onClick={handleClick}
        >
          <span className="hotspot__dot">
            <HotspotIcon id={id} />
          </span>
          <span className="hotspot__tooltip">
            <span className="hotspot__name">{name}</span>
            {!enabled ? (
              <span className="hotspot__status">Off</span>
            ) : (
              detail && <span className="hotspot__amps num">{detail}</span>
            )}
          </span>
        </button>
      </Html>
    </group>
  )
}

export function Hotspots() {
  return (
    <group>
      <Hotspot id="battery" />
      {DEVICES.map((d) => (
        <Hotspot key={d.id} id={d.id} />
      ))}
      <Hotspot id="alternator" />
      <Hotspot id="solar" />
      <Hotspot id="shore" />
    </group>
  )
}
