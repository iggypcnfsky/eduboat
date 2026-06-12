import type { DeviceId, SimConfig, Snapshot } from './types'
import { DEVICES } from './devices'
import { CHEMISTRIES, chargePhase } from './battery'
import {
  START_TOD,
  DAY_MINUTES,
  SUNRISE_TOD,
  SUNSET_TOD,
  SYSTEM_VOLTAGE,
  ALTERNATOR_RATED_A,
  SHORE_CHARGER_A,
  SOLAR_W,
  INITIAL_SOC,
  DEFAULT_START_FUEL_L,
  FUEL_CONSUMPTION_LPH,
} from './constants'

export const minuteToTod = (minute: number) => (START_TOD + minute) % DAY_MINUTES

export function formatTod(minute: number): string {
  const tod = minuteToTod(Math.floor(minute))
  const h24 = Math.floor(tod / 60)
  const m = tod % 60
  const period = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

/** Solar production in amps for a time of day and cloud cover. */
export function solarAmps(tod: number, cloudCover: number): number {
  if (tod <= SUNRISE_TOD || tod >= SUNSET_TOD) return 0
  const f = Math.sin((Math.PI * (tod - SUNRISE_TOD)) / (SUNSET_TOD - SUNRISE_TOD))
  const watts = SOLAR_W * Math.pow(f, 1.3) * (1 - 0.85 * cloudCover)
  return watts / SYSTEM_VOLTAGE
}

const zeroByDevice = (): Record<DeviceId, number> =>
  Object.fromEntries(DEVICES.map((d) => [d.id, 0])) as Record<DeviceId, number>

export function initialSnapshot(config?: Pick<SimConfig, 'startSoc' | 'startFuelL'>): Snapshot {
  return {
    minute: 0,
    soc: config?.startSoc ?? INITIAL_SOC,
    loads: zeroByDevice(),
    loadA: 0,
    solarA: 0,
    altA: 0,
    shoreA: 0,
    battA: 0,
    phase: null,
    ahIn: 0,
    ahOut: 0,
    ahByDevice: zeroByDevice(),
    fuelL: config?.startFuelL ?? DEFAULT_START_FUEL_L,
    fuelUsedL: 0,
  }
}

/** Advance the simulation by one minute. Pure function. */
export function step(prev: Snapshot, config: SimConfig): Snapshot {
  const minute = prev.minute + 1
  const tod = minuteToTod(minute)
  const chem = CHEMISTRIES[config.chemistry]

  const loads = zeroByDevice()
  const ahByDevice = { ...prev.ahByDevice }
  let loadA = 0
  for (const dev of DEVICES) {
    if (!config.devicesEnabled[dev.id]) continue
    const a = dev.draw(tod, minute)
    loads[dev.id] = a
    loadA += a
    ahByDevice[dev.id] += a / 60
  }

  const solarA = solarAmps(tod, config.cloudCover)
  const fuelBurn = config.engineOn && prev.fuelL > 0 ? FUEL_CONSUMPTION_LPH / 60 : 0
  const fuelL = Math.max(0, prev.fuelL - fuelBurn)
  const engineRunning = config.engineOn && prev.fuelL > 0
  const altA = engineRunning ? ALTERNATOR_RATED_A : 0
  const shoreA = config.shorePowerOn ? SHORE_CHARGER_A : 0
  const sourceA = solarA + altA + shoreA

  // Sources feed the loads first; the surplus charges the bank,
  // limited by what the bank will accept at this SOC (acceptance current).
  const acceptanceA = chem.acceptC(prev.soc) * config.capacityAh
  const surplus = sourceA - loadA
  const battA = surplus > 0 ? Math.min(surplus, acceptanceA) : surplus

  const soc = Math.min(100, Math.max(0, prev.soc + ((battA / 60) * 100) / config.capacityAh))

  return {
    minute,
    soc,
    loads,
    loadA,
    solarA,
    altA,
    shoreA,
    battA,
    phase: chargePhase(config.chemistry, prev.soc, battA > 0.05),
    ahIn: prev.ahIn + Math.max(battA, 0) / 60,
    ahOut: prev.ahOut + Math.max(-battA, 0) / 60,
    ahByDevice,
    fuelL,
    fuelUsedL: prev.fuelUsedL + fuelBurn,
  }
}

/** Run forward from a snapshot without recording history. */
export function forecast(from: Snapshot, config: SimConfig, untilMinute: number): Snapshot {
  let s = from
  const end = Math.min(untilMinute, DAY_MINUTES)
  while (s.minute < end) s = step(s, config)
  return s
}
