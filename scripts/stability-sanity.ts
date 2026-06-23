/* Stability hydrostatics sanity checks. Run: npx tsx scripts/stability-sanity.ts */
import {
  buildBargeOutline,
  computeBargeUprightBM,
  computeHydrostatics,
  computeUprightMetrics,
} from '../src/procedures/initial-stability/sim/hydrostatics'
import { bodyToEarthOutline, findWaterlineForArea, bodyToEarth } from '../src/procedures/initial-stability/sim/geometry'
import { designReferenceAreaForConfig } from '../src/procedures/initial-stability/sim/keel-config'
import {
  clampCustomHullDraft,
  deriveHullParams,
  designWaterlineZForDraft,
  sampleCustomHullOutline,
  applyCustomHullKeelHeight,
  customHullKeelHeight,
  exportCustomHullSvg,
  createDefaultCustomHullDesign,
} from '../src/procedures/initial-stability/sim/custom-hull'
import type { CustomHullDesign } from '../src/procedures/initial-stability/sim/custom-hull'
import { exportCustomHullDesignSvg } from '../src/procedures/initial-stability/components/dimension-overlay'
import {
  computeCenterOfGravity,
  DEFAULT_VESSEL_LENGTH_M,
  clampTotalBoatMassKg,
  defaultKeelBallastKg,
  defaultTotalBoatMassKg,
  defaultTotalMassKg,
  linearLoadsFromConfig,
  weightSliderMaxKg,
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
    waveSwayEnabled: false,
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

// 7. Param sliders preserve total weight (no withDesignDisplacement on setParam)
{
  const customMass = 42_000
  const base = finConfig({ totalBoatMassKg: customMass, keelBallastKg: 8_000 })

  function applyParamChange(cfg: SimConfig, key: keyof SimConfig['params'], value: number): SimConfig {
    return { ...cfg, params: { ...cfg.params, [key]: value } }
  }

  const afterDraft = applyParamChange(base, 'draft', base.params.draft + 0.35)
  const draftSnap = computeHydrostatics(afterDraft)
  assert('Draft change preserves totalBoatMassKg', afterDraft.totalBoatMassKg === customMass)
  assert('Draft change hydrostatics ok', draftSnap.ok, draftSnap.error)

  const afterFin = applyParamChange(base, 'finDepth', base.params.finDepth + 0.4)
  const finSnap = computeHydrostatics(afterFin)
  assert('Fin depth change preserves totalBoatMassKg', afterFin.totalBoatMassKg === customMass)
  assert('Fin depth change hydrostatics ok', finSnap.ok, finSnap.error)

  const afterLwl = { ...base, vesselLengthM: base.vesselLengthM + 3 }
  const lwlSnap = computeHydrostatics(afterLwl)
  assert('LWL change preserves totalBoatMassKg', afterLwl.totalBoatMassKg === customMass)
  assert('LWL change hydrostatics ok', lwlSnap.ok, lwlSnap.error)

  const heavyKeel = finConfig({ totalBoatMassKg: 42_000, keelBallastKg: 40_000 })
  const maxKg = weightSliderMaxKg(heavyKeel)
  const totalAfterLower = clampTotalBoatMassKg(Math.max(heavyKeel.keelBallastKg, 25_000), maxKg)
  assert(
    'Lowering total below keel preserves keel ballast',
    heavyKeel.keelBallastKg === 40_000 && totalAfterLower === 40_000,
    `keel=${heavyKeel.keelBallastKg}, total=${totalAfterLower}`,
  )
}

// 8. Custom hull draft slider maps to design waterline Z
{
  const design: CustomHullDesign = {
    id: 'test-hull',
    name: 'Test',
    nodes: [
      { anchor: { x: 0, z: 0 }, handleIn: { x: 0, z: 0 }, handleOut: { x: 0.2, z: 0.1 }, handlesLinked: true, region: 'hull' },
      { anchor: { x: 1.6, z: 0.4 }, handleIn: { x: -0.2, z: 0 }, handleOut: { x: 0.2, z: 0.2 }, handlesLinked: true, region: 'hull' },
      { anchor: { x: 0, z: 1.2 }, handleIn: { x: -0.2, z: 0 }, handleOut: { x: 0, z: 0 }, handlesLinked: true, region: 'hull' },
    ],
    designWaterlineZ: 0.55,
    createdAt: 0,
    updatedAt: 0,
  }
  const outline = sampleCustomHullOutline(design)
  const targetDraft = clampCustomHullDraft(outline, 0.72)
  const wlZ = designWaterlineZForDraft(outline, targetDraft)
  const derived = deriveHullParams(outline, wlZ)
  assert('Custom draft maps to design WL', Math.abs(derived.draft - targetDraft) < 0.001, `draft=${derived.draft}`)
}

// 9. Custom hull keel height extends downward from fixed hull/keel junction
{
  const design: CustomHullDesign = {
    id: 'keel-hull',
    name: 'Keel',
    nodes: [
      { anchor: { x: 0, z: -0.4 }, handleIn: { x: 0, z: 0 }, handleOut: { x: 0.2, z: 0.1 }, handlesLinked: true, region: 'keel' },
      { anchor: { x: 0.3, z: 0.05 }, handleIn: { x: -0.1, z: -0.05 }, handleOut: { x: 0.2, z: 0.1 }, handlesLinked: true, region: 'keel' },
      { anchor: { x: 1.4, z: 0.5 }, handleIn: { x: -0.2, z: 0 }, handleOut: { x: 0.2, z: 0.2 }, handlesLinked: true, region: 'hull' },
      { anchor: { x: 0, z: 1.1 }, handleIn: { x: 0.2, z: 0 }, handleOut: { x: 0, z: 0 }, handlesLinked: true, region: 'hull' },
    ],
    designWaterlineZ: 0.45,
    createdAt: 0,
    updatedAt: 0,
  }
  const junctionZ = design.nodes[2].anchor.z
  const keelShapeDz = design.nodes[1].anchor.z - design.nodes[0].anchor.z
  const before = customHullKeelHeight(design)
  const updated = applyCustomHullKeelHeight(design, before + 0.25)
  const after = customHullKeelHeight(updated)
  assert('Custom keel height applies to design', Math.abs(after - (before + 0.25)) < 0.02, `${before.toFixed(2)} → ${after.toFixed(2)}`)
  assert(
    'Hull junction stays fixed when extending height',
    Math.abs(updated.nodes[2].anchor.z - junctionZ) < 1e-6,
    `junction ${junctionZ.toFixed(3)} → ${updated.nodes[2].anchor.z.toFixed(3)}`,
  )
  assert(
    'Keel shape preserved (rigid translate)',
    Math.abs(updated.nodes[1].anchor.z - updated.nodes[0].anchor.z - keelShapeDz) < 1e-6,
  )
}

// 10. Dimension lines use hull geometry for deck / draft (not params-only deck)
{
  const { computeDimensionSpecs } = await import(
    '../src/procedures/initial-stability/components/dimension-overlay'
  )
  const { applyKeelDatumParts } = await import('../src/procedures/initial-stability/sim/hull-presets')
  const { buildHullPartsForConfig } = await import('../src/procedures/initial-stability/sim/keel-config')
  const cfg = finConfig({
    presetId: 'box-barge',
    params: {
      beam: 4,
      draft: 2,
      freeboard: 1,
      bilgeRadius: 0,
      finDepth: 0,
      keelThickness: 0,
      demiHullWidth: 0,
    },
    keelBallastId: 'none',
  })
  const bodyParts = applyKeelDatumParts(buildHullPartsForConfig(cfg))
  const snap = computeHydrostatics(cfg)
  const earthParts = bodyParts.map((p) => p.map((pt) => bodyToEarth(pt, snap.heelRad)))
  const specs = computeDimensionSpecs({
    config: cfg,
    bodyParts,
    displayEarthParts: earthParts,
    hullHeaveZs: [0],
    deckHeaveZ: 0,
    actualWlEarthZ: () => snap.waterlineZ,
    heelRad: snap.heelRad,
  })
  const draftSpec = specs.find((s) => s.id === 'design-draft')
  const freeboardSpec = specs.find((s) => s.id === 'design-freeboard')
  const deckZ = Math.max(...earthParts[0].map((p) => p.z))
  assert('Design draft matches params', draftSpec && Math.abs(draftSpec.valueM - cfg.params.draft) < 0.05)
  assert(
    'Design freeboard line reaches deck geometry',
    freeboardSpec && Math.abs(freeboardSpec.bBody.z - deckZ) < 0.05,
    `deck line z=${freeboardSpec?.bBody.z?.toFixed(3)} hull deck=${deckZ.toFixed(3)}`,
  )
}

// 11. Custom hull SVG export for clipboard
{
  const design = createDefaultCustomHullDesign('Export test')
  const hullSvg = exportCustomHullSvg(design)
  assert(
    'Hull SVG has xmlns and path',
    hullSvg.includes('xmlns="http://www.w3.org/2000/svg"') &&
      hullSvg.includes('<path d="') &&
      hullSvg.includes('</svg>'),
  )
  const viewBoxMatch = hullSvg.match(/viewBox="([^"]+)"/)
  assert('Hull SVG viewBox is valid', viewBoxMatch !== null && viewBoxMatch[1].split(' ').length === 4)

  const designSvg = exportCustomHullDesignSvg(design)
  assert('Design SVG has waterline', designSvg.includes('stroke-dasharray="2.400 1.600"'))
  assert(
    'Design SVG has dimension labels',
    designSvg.includes('Beam') && designSvg.includes('<text'),
  )
}

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
