/* Quick numeric sanity check for the simulation engine. Run: npx tsx scripts/sanity.ts */
import { initialSnapshot, step, forecast, formatTod } from '../src/procedures/night-at-anchor/sim/engine'
import { defaultDevicesEnabled } from '../src/procedures/night-at-anchor/sim/devices'
import { DEFAULT_START_FUEL_L, INITIAL_SOC } from '../src/procedures/night-at-anchor/sim/constants'
import type { SimConfig } from '../src/procedures/night-at-anchor/sim/types'

const base: SimConfig = {
  capacityAh: 300,
  chemistry: 'AGM',
  cloudCover: 0.25,
  engineOn: false,
  devicesEnabled: defaultDevicesEnabled(),
  startSoc: INITIAL_SOC,
  startFuelL: DEFAULT_START_FUEL_L,
}

// Night 18:00 → 08:00 without charging decisions
let s = initialSnapshot(base)
const morning = forecast(s, base, 840)
console.log(`Morning 08:00 — SOC ${morning.soc.toFixed(1)}% (start ${base.startSoc}), out ${morning.ahOut.toFixed(1)} Ah, in ${morning.ahIn.toFixed(1)} Ah (solar)`)
console.log('By device overnight:', Object.entries(morning.ahByDevice).map(([k, v]) => `${k}=${v.toFixed(1)}`).join(' '))

// Then start the engine at 08:00 and run 1 hour
const engineCfg = { ...base, engineOn: true }
let e = morning
const points: string[] = []
for (let i = 0; i < 120; i++) {
  e = step(e, engineCfg)
  if (i % 15 === 0) points.push(`${formatTod(e.minute)} soc=${e.soc.toFixed(1)} battA=${e.battA.toFixed(1)} phase=${e.phase}`)
}
console.log('Engine charging from 08:00:')
points.forEach((p) => console.log('  ' + p))

// Full day, no engine
const end = forecast(initialSnapshot(base), base, 1440)
console.log(`End of day 18:00 — SOC ${end.soc.toFixed(1)}%, out ${end.ahOut.toFixed(1)} Ah, in ${end.ahIn.toFixed(1)} Ah`)

// Heater on (the hidden eater)
const heaterCfg = { ...base, devicesEnabled: { ...defaultDevicesEnabled(), heater: true } }
const hMorning = forecast(initialSnapshot(base), heaterCfg, 840)
console.log(`With heater — morning SOC ${hMorning.soc.toFixed(1)}% (vs ${morning.soc.toFixed(1)}%)`)

// LiFePO4 charges faster
const liCfg: SimConfig = { ...base, chemistry: 'LiFePO4', engineOn: true }
let li = { ...morning }
for (let i = 0; i < 60; i++) li = step(li, liCfg)
console.log(`LiFePO4 after 1 h engine: SOC ${li.soc.toFixed(1)}% (AGM: ${forecast(morning, engineCfg, morning.minute + 60).soc.toFixed(1)}%)`)
