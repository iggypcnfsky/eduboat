import type { LucideIcon } from 'lucide-react'
import {
  Anchor,
  Battery,
  Compass,
  Droplets,
  Fan,
  Flame,
  LampCeiling,
  Laptop,
  Lightbulb,
  Monitor,
  Music,
  PlugZap,
  Radio,
  Radar,
  Refrigerator,
  Satellite,
  Sun,
  Usb,
  Wifi,
  Waves,
  Cog,
  Zap,
} from 'lucide-react'
import type { ElementId } from '../sim/types'

const SCHEMATIC_ICONS: Record<ElementId, LucideIcon> = {
  fridge: Refrigerator,
  anchorLight: Anchor,
  cabinLights: Lightbulb,
  cockpitLights: LampCeiling,
  plotter: Monitor,
  vhf: Radio,
  ais: Satellite,
  autopilot: Compass,
  waterPump: Droplets,
  usb: Usb,
  laptop: Laptop,
  wifiRouter: Wifi,
  inverter: Zap,
  stereo: Music,
  fans: Fan,
  heater: Flame,
  radar: Radar,
  bilgePump: Waves,
  alternator: Cog,
  solar: Sun,
  shore: PlugZap,
  battery: Battery,
}

const TONE_COLOR = {
  default: '#b8c8d4',
  in: '#5FD4C4',
  out: '#F0A35E',
  muted: '#6a8294',
} as const

/** Lucide icon embedded in the schematic SVG via foreignObject. */
export function SchematicTileIcon({
  id,
  x,
  y,
  size = 20,
  tone = 'default',
}: {
  id: ElementId
  x: number
  y: number
  size?: number
  tone?: keyof typeof TONE_COLOR
}) {
  const Icon = SCHEMATIC_ICONS[id]

  return (
    <foreignObject x={x} y={y} width={size} height={size} pointerEvents="none">
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: TONE_COLOR[tone],
        }}
      >
        <Icon size={size - 2} strokeWidth={1.75} aria-hidden />
      </div>
    </foreignObject>
  )
}
