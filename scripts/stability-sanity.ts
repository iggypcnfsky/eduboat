/* Stability hydrostatics sanity checks. Run: npx tsx scripts/stability-sanity.ts */
import {
  buildBargeOutline,
  computeBargeUprightBM,
  computeHydrostatics,
  computeUprightMetrics,
} from '../src/procedures/initial-stability/sim/hydrostatics'
import { bodyToEarthOutline, findWaterlineForArea } from '../src/procedures/initial-stability/sim/geometry'
import { designReferenceAreaForConfig } from '../src/procedures/initial-stability/sim/keel-config'
import {
  computeCenterOfGravity,
  DEFAULT_VESSEL_LENGTH_M,
  defaultKeelBallastKg,
  defaultTotalBoatMassKg,
  defaultTotalMassKg,
  linearLoadsFromConfig,
} from '../src/procedures/initial-stability/sim/weight-distribution'
import type { SimConfig } from '../src/procedures/initial-stability/sim/types'

let passed = 0
let failed = 0

function assert(name: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ✓ ${name}`)
    passed++
  } else {
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
    failed++
  }
}

const FIN_PARAMS = {
  beam: 3.6,
  draft: 1.8,
  freeboard: 1.2,
  bilgeRadius: 0.45,
  finDepth: 0.9,
  keelThickness: 0.35,
  demiHullWidth: 1.4,
}

function finConfig(partial: Partial<SimConfig> = {}): SimConfig {
  const base: SimConfig = {
    presetId: 'fin-keel',
    templateId: 'fin-keel-generic',
    params: FIN_PARAMS,
    keelBallastId: 'fin',
    heelDeg: 0,
    vesselLengthM: DEFAULT_VESSEL_LENGTH_M,
    totalBoatMassKg: 0,
    keelBallastKg: 0,
    waveHeightM: 0.35,
    wavePeriodS: 5,
    waveNoise: 0,
    simSpeed: 1,
    dampingRatio: 0.07,
    dynamicHullStabilization: false,
    jointedDeck: false,
    hullStabilizationStrength: 0.85,
    hullStabilizationLimitM: 0.5,
    ...partial,
  }
  if (!partial.totalBoatMassKg) {
    base.totalBoatMassKg = defaultTotalBoatMassKg(base)
  }
  if (partial.keelBallastKg === undefined && partial.keelBallastId === undefined) {
    base.keelBallastKg = defaultKeelBallastKg(base, base.keelBallastId)
  }
  return base
}

// 1. Barge BM analytical check
{
  const beam = 4
  const draft = 2
  const outline = buildBargeOutline(beam, draft)
  const earth = bodyToEarthOutline(outline, 0)
  const targetArea = beam * draft
  const eq = findWaterlineForArea(earth, targetArea, -5, draft + 5)
  if (eq) {
    const bm = computeBargeUprightBM(beam, draft)
    const bmNum = eq.result.inertia / eq.result.area
    assert('Barge BM analytical', Math.abs(bm - bmNum) / bm < 0.02, `${bm.toFixed(4)} vs ${bmNum.toFixed(4)}`)
  } else {
    assert('Barge BM analytical', false, 'waterline search failed')
  }
}

// 2. Small angle GZ ≈ GM·sin(θ)
{
  const properConfig: SimConfig = {
    ...finConfig(),
    heelDeg: 5,
  }
  const snap = computeHydrostatics(properConfig)
  if (snap.ok) {
    const err = Math.abs(snap.gz - snap.gzApprox) / Math.max(Math.abs(snap.gz), 1e-6)
    assert('Small-angle GZ error < 2%', err < 0.02, `GZ=${snap.gz.toFixed(4)} m, GM·sin(θ)=${snap.gzApprox.toFixed(4)} m, GM=${snap.gmUpright.toFixed(3)} m`)
  } else {
    assert('Fin-keel snapshot ok', false, snap.error)
  }
}

// 3. Multihull presets
{
  for (const id of ['catamaran', 'trimaran'] as const) {
    const cfg = finConfig({ presetId: id })
    const snap = computeHydrostatics(cfg)
    assert(`${id} snapshot ok`, snap.ok, snap.error)
    if (snap.ok) {
      const n = snap.hullEarthParts.length
      assert(`${id} renders ${n} hulls`, id === 'catamaran' ? n === 2 : n === 3)
    }
  }
}

// 4. Symmetric GZ curve
{
  const cfg = finConfig()
  const pos = computeHydrostatics({ ...cfg, heelDeg: 15 })
  const neg = computeHydrostatics({ ...cfg, heelDeg: -15 })
  if (pos.ok && neg.ok) {
    assert(
      'Symmetric GZ(15°) ≈ -GZ(-15°)',
      Math.abs(pos.gz + neg.gz) < 0.05,
      `+${pos.gz.toFixed(4)} / ${neg.gz.toFixed(4)}`,
    )
  }
}

// 5. Keel ballast lowers G vs bare hull at same mass; extreme KG gives instability
{
  const cfg = finConfig()
  const boatMass = defaultTotalBoatMassKg(cfg)
  const keelMass = defaultKeelBallastKg(cfg, 'fin')
  const stable = finConfig({ keelBallastId: 'fin', totalBoatMassKg: boatMass, keelBallastKg: keelMass })
  const topHeavy = finConfig({ keelBallastId: 'none', totalBoatMassKg: boatMass, keelBallastKg: 0 })
  const stableLoads = linearLoadsFromConfig(stable)
  const topLoads = linearLoadsFromConfig(topHeavy)
  const cgStable = computeCenterOfGravity(
    stable.presetId,
    stable.params,
    stable.keelBallastId,
    designReferenceAreaForConfig(stable),
    stableLoads.linearTotalKg,
    stableLoads.linearKeelKg,
  )
  const cgHeavy = computeCenterOfGravity(
    topHeavy.presetId,
    topHeavy.params,
    topHeavy.keelBallastId,
    designReferenceAreaForConfig(topHeavy),
    topLoads.linearTotalKg,
    topLoads.linearKeelKg,
  )
  const gmStable = computeUprightMetrics(stable, cgStable.gZ)
  const gmHeavy = computeUprightMetrics(topHeavy, cgHeavy.gZ)
  if (gmStable && gmHeavy) {
    assert('Keel ballast lowers KG vs no ballast', cgStable.gZ < cgHeavy.gZ, `${cgStable.gZ.toFixed(3)} vs ${cgHeavy.gZ.toFixed(3)}`)
    assert('Keel ballast improves GM vs no ballast', gmStable.gm > gmHeavy.gm, `${gmStable.gm.toFixed(3)} vs ${gmHeavy.gm.toFixed(3)}`)
  }

  const extreme = computeUprightMetrics(cfg, 3.2)
  if (extreme) {
    assert('Extreme KG gives GM < 0', extreme.gm < 0, `GM=${extreme.gm.toFixed(3)}`)
  }
}

// 6. K at hull keel (z=0 in body frame)
{
  const cfg = finConfig()
  const snap = computeHydrostatics(cfg)
  if (snap.ok) {
    assert('K at origin in body frame', Math.abs(snap.kEarth.x) < 1e-6 && Math.abs(snap.kEarth.z) < 1e-6)
  }
}

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
