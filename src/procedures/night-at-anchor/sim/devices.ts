import type { DeviceId } from './types'
import { DUSK_TOD, DAWN_TOD } from './constants'

export interface DeviceDef {
  id: DeviceId
  name: string
  /** Nameplate draw when running, amps. */
  amps: number
  /** Footnote shown in Sources & assumptions. */
  source: string
  defaultOn: boolean
  /** Draw in amps at a given time-of-day (minutes from midnight) and sim minute. */
  draw: (tod: number, minute: number) => number
}

const isNight = (tod: number) => tod >= DUSK_TOD || tod < DAWN_TOD

const inWindow = (tod: number, from: number, to: number) =>
  from <= to ? tod >= from && tod < to : tod >= from || tod < to

const evening = (tod: number) => inWindow(tod, 19 * 60 + 30, 23 * 60 + 30)
const nightHours = (tod: number) => inWindow(tod, 22 * 60, 7 * 60)
const chargeWindow = (tod: number) =>
  inWindow(tod, 19 * 60, 23 * 60) || inWindow(tod, 7 * 60, 9 * 60)

/** Water-pump usage moments: [time-of-day, duration min]. */
const PUMP_PULSES: Array<[number, number]> = [
  [19 * 60 + 5, 2],
  [21 * 60 + 40, 1],
  [22 * 60 + 55, 1],
  [7 * 60 + 35, 2],
  [8 * 60 + 20, 1],
  [12 * 60 + 30, 1],
  [17 * 60 + 10, 1],
]

/** Bilge auto-cycles — short bursts overnight. */
const BILGE_PULSES: Array<[number, number]> = [
  [2 * 60 + 10, 1],
  [4 * 60 + 45, 1],
  [23 * 60 + 15, 1],
]

export const DEVICES: DeviceDef[] = [
  {
    id: 'fridge',
    name: 'Fridge',
    amps: 4.0,
    source: 'West Marine Electrical Budget Worksheet: 12 V fridge ~4 A, ~40% duty → ~40 Ah/day',
    defaultOn: true,
    draw: (_tod, minute) => (minute % 30 < 12 ? 4.0 : 0),
  },
  {
    id: 'anchorLight',
    name: 'Anchor light',
    amps: 0.4,
    source: 'LED anchor light ~0.4 A (eMarine energy calculator); required at anchor (COLREGs)',
    defaultOn: true,
    draw: (tod) => (isNight(tod) ? 0.4 : 0),
  },
  {
    id: 'cabinLights',
    name: 'Cabin lights',
    amps: 1.5,
    source: 'LED cabin lighting ~1.5 A while in use (West Marine worksheet)',
    defaultOn: true,
    draw: (tod) => (evening(tod) ? 1.5 : 0),
  },
  {
    id: 'cockpitLights',
    name: 'Cockpit lights',
    amps: 1.0,
    source: 'LED cockpit / transom light ~1 A (West Marine worksheet)',
    defaultOn: true,
    draw: (tod) => (evening(tod) ? 1.0 : 0),
  },
  {
    id: 'plotter',
    name: 'Plotter',
    amps: 1.5,
    source: 'Chartplotter + instruments standby ~1.5 A (eMarine calculator)',
    defaultOn: true,
    draw: () => 1.5,
  },
  {
    id: 'vhf',
    name: 'VHF',
    amps: 0.5,
    source: 'VHF on standby ~0.5 A (West Marine worksheet)',
    defaultOn: true,
    draw: () => 0.5,
  },
  {
    id: 'ais',
    name: 'AIS transponder',
    amps: 0.5,
    source: 'Class B AIS ~0.5 A continuous (manufacturer data)',
    defaultOn: true,
    draw: () => 0.5,
  },
  {
    id: 'autopilot',
    name: 'Autopilot',
    amps: 1.2,
    source: 'Autopilot electronics ~1–2 A at anchor with anchor alarm (Raymarine-class data)',
    defaultOn: false,
    draw: () => 1.2,
  },
  {
    id: 'waterPump',
    name: 'Water pump',
    amps: 4.0,
    source: 'Pressure water pump ~4 A in short bursts when taps run (West Marine worksheet)',
    defaultOn: true,
    draw: (tod) => (PUMP_PULSES.some(([t, d]) => tod >= t && tod < t + d) ? 4.0 : 0),
  },
  {
    id: 'usb',
    name: 'USB charging',
    amps: 1.5,
    source: 'Two phones + tablet on USB ~1.5 A while charging (eMarine calculator)',
    defaultOn: true,
    draw: (tod) => (chargeWindow(tod) ? 1.5 : 0),
  },
  {
    id: 'laptop',
    name: 'Laptop charger',
    amps: 2.0,
    source: '12 V laptop charger ~2 A (eMarine calculator)',
    defaultOn: false,
    draw: (tod) => (chargeWindow(tod) ? 2.0 : 0),
  },
  {
    id: 'wifiRouter',
    name: 'Wi‑Fi router',
    amps: 0.6,
    source: 'Marine Wi‑Fi router ~0.5–0.7 A (manufacturer data)',
    defaultOn: true,
    draw: () => 0.6,
  },
  {
    id: 'inverter',
    name: 'Inverter',
    amps: 1.0,
    source: 'Inverter no-load / idle ~0.5–1.5 A (Victron datasheet)',
    defaultOn: false,
    draw: () => 1.0,
  },
  {
    id: 'stereo',
    name: 'Stereo',
    amps: 1.2,
    source: 'Cabin stereo ~1–2 A at modest volume (West Marine worksheet)',
    defaultOn: false,
    draw: (tod) => (evening(tod) ? 1.2 : 0),
  },
  {
    id: 'fans',
    name: 'Cabin fans',
    amps: 0.8,
    source: 'Two 12 V fans ~0.4 A each (West Marine worksheet)',
    defaultOn: true,
    draw: (tod) => (nightHours(tod) ? 0.8 : 0),
  },
  {
    id: 'heater',
    name: 'Diesel heater',
    amps: 3.0,
    source: 'Diesel air heater (Webasto-class) fan + pump 2–4 A (manufacturer data)',
    defaultOn: false,
    draw: (tod) => (nightHours(tod) ? 3.0 : 0),
  },
  {
    id: 'radar',
    name: 'Radar',
    amps: 2.5,
    source: 'Pulse radar standby ~2–4 A (manufacturer data)',
    defaultOn: false,
    draw: () => 2.5,
  },
  {
    id: 'bilgePump',
    name: 'Bilge pump',
    amps: 3.5,
    source: 'Automatic bilge pump ~3–5 A in short cycles (West Marine worksheet)',
    defaultOn: true,
    draw: (tod) => (BILGE_PULSES.some(([t, d]) => tod >= t && tod < t + d) ? 3.5 : 0),
  },
]

export const DEVICE_MAP: Record<DeviceId, DeviceDef> = Object.fromEntries(
  DEVICES.map((d) => [d.id, d]),
) as Record<DeviceId, DeviceDef>

export const defaultDevicesEnabled = (): Record<DeviceId, boolean> =>
  Object.fromEntries(DEVICES.map((d) => [d.id, d.defaultOn])) as Record<DeviceId, boolean>
