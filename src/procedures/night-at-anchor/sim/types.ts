export type DeviceId =
  | 'fridge'
  | 'anchorLight'
  | 'cabinLights'
  | 'cockpitLights'
  | 'plotter'
  | 'vhf'
  | 'ais'
  | 'autopilot'
  | 'waterPump'
  | 'usb'
  | 'laptop'
  | 'wifiRouter'
  | 'inverter'
  | 'stereo'
  | 'fans'
  | 'heater'
  | 'radar'
  | 'bilgePump'

export type SourceId = 'alternator' | 'solar' | 'shore'

export type ElementId = DeviceId | SourceId | 'battery'

export type Chemistry = 'AGM' | 'LiFePO4'

export type ChargePhase = 'bulk' | 'absorption' | 'float' | null

export type BeatId = 'night-summary' | 'engine-charging' | 'soc-floor' | 'day-summary'

export interface SimConfig {
  capacityAh: 200 | 300 | 400
  chemistry: Chemistry
  /** 0 = clear sky, 1 = full overcast */
  cloudCover: number
  engineOn: boolean
  /** Shore-power cord connected (marina / generator on dock). */
  shorePowerOn: boolean
  devicesEnabled: Record<DeviceId, boolean>
  /** Bank SOC at 18:00 when the day begins, percent */
  startSoc: number
  /** Diesel in tank at 18:00, litres */
  startFuelL: number
}

export interface Snapshot {
  /** Minutes since simulation start (18:00). 0..1440 */
  minute: number
  /** State of charge, percent 0..100 */
  soc: number
  /** Per-device draw right now, amps */
  loads: Record<DeviceId, number>
  /** Total load, amps */
  loadA: number
  /** Solar production right now, amps (at 13 V nominal) */
  solarA: number
  /** Alternator production right now, amps */
  altA: number
  /** Shore charger output right now, amps */
  shoreA: number
  /** Net battery current: + charging, - discharging, amps */
  battA: number
  phase: ChargePhase
  /** Cumulative Ah charged into the bank */
  ahIn: number
  /** Cumulative Ah drawn from the bank */
  ahOut: number
  /** Cumulative Ah consumed per device */
  ahByDevice: Record<DeviceId, number>
  /** Diesel remaining, litres */
  fuelL: number
  /** Diesel burned since 18:00, litres */
  fuelUsedL: number
}
