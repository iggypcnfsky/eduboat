import {
  bodyToEarth,
  bodyToEarthOutline,
  centerlineDirection,
  computeSubmergedMulti,
  earthToBody,
  findWaterlineForAreaMulti,
  heelRadFromDeg,
} from './geometry'
import { computeEquilibriumArea } from './equilibrium'
import {
  buildHullPartsForConfig,
  ballastBodyPosition,
  designReferenceAreaForConfig,
} from './keel-config'
import { applyKeelDatumParts } from './hull-presets'
import { buildBoxBargeOutline } from './hull-presets'
import { computeCenterOfGravity, linearLoadsFromConfig } from './weight-distribution'
import { G, RHO_SEAWATER, type HydroSnapshot, type SimConfig, type Vec2 } from './types'

/** Relative error between GZ and GM·sin(θ); meaningless near upright where both → 0. */
export function computeApproxErrorPct(gz: number, gzApprox: number, heelDeg: number): number {
  if (Math.abs(heelDeg) < 2) return 0
  const denom = Math.max(Math.abs(gz), Math.abs(gzApprox))
  if (denom < 1e-4) return 0
  return (Math.abs(gz - gzApprox) / denom) * 100
}

function fail(partial: Partial<HydroSnapshot>, error: string): HydroSnapshot {
  const hullEarth = partial.hullEarth ?? []
  return {
    ok: false,
    error,
    heelRad: 0,
    waterlineZ: 0,
    area: 0,
    bEarth: { x: 0, z: 0 },
    bBody: { x: 0, z: 0 },
    gEarth: { x: 0, z: 0 },
    mEarth: { x: 0, z: 0 },
    mBody: { x: 0, z: 0 },
    kEarth: { x: 0, z: 0 },
    kb: 0,
    bm: 0,
    kg: 0,
    gm: 0,
    gz: 0,
    mr: 0,
    weightKN: 0,
    displacementKg: 0,
    gzApprox: 0,
    approxErrorPct: 0,
    hullEarth,
    hullEarthParts: partial.hullEarthParts ?? (hullEarth.length ? [hullEarth] : []),
    submergedEarth: [],
    waterlineSegments: [],
    m0Earth: { x: 0, z: 0 },
    m0EarthPlumb: { x: 0, z: 0 },
    gmUpright: 0,
    kbUpright: 0,
    bmUpright: 0,
    gX: 0,
    gZ: 0,
    totalBoatMassKg: 0,
    vesselLengthM: 0,
    gEarthUpright: { x: 0, z: 0 },
    bEarthUpright: { x: 0, z: 0 },
    ...partial,
  }
}

export interface UprightMetrics {
  kb: number
  bm: number
  gm: number
  kg: number
}

function uprightSubmergedArea(config: SimConfig): number {
  return computeEquilibriumArea(config)
}

function hullEarthPartsForConfig(config: SimConfig, heelRad: number): Vec2[][] {
  const shifted = applyKeelDatumParts(buildHullPartsForConfig(config))
  return shifted.map((part) => bodyToEarthOutline(part, heelRad))
}

function boundsZ(parts: Vec2[][]): { zMin: number; zMax: number } {
  const zs = parts.flatMap((p) => p.map((pt) => pt.z))
  return { zMin: Math.min(...zs), zMax: Math.max(...zs) }
}

/** Upright (θ=0) submerged centroid in earth frame. */
export function computeUprightBEarth(config: SimConfig): Vec2 | null {
  const hullEarthParts = hullEarthPartsForConfig(config, 0)
  const { zMin, zMax } = boundsZ(hullEarthParts)
  const area = uprightSubmergedArea(config)
  const eq = findWaterlineForAreaMulti(hullEarthParts, area, zMin, zMax)
  return eq ? eq.result.centroid : null
}

/** Compute upright (θ=0) KB, BM, GM for decomposition. */
export function computeUprightMetrics(config: SimConfig, gZBody: number): UprightMetrics | null {
  const hullEarthParts = hullEarthPartsForConfig(config, 0)
  const { zMin, zMax } = boundsZ(hullEarthParts)
  const area = uprightSubmergedArea(config)

  const eq = findWaterlineForAreaMulti(hullEarthParts, area, zMin, zMax)
  if (!eq) return null

  const { centroid, area: achieved, inertia } = eq.result
  const kb = earthToBody(centroid, 0).z
  const bm = achieved > 1e-9 ? inertia / achieved : 0
  const kg = gZBody
  const gm = kb + bm - kg
  return { kb, bm, gm, kg }
}

export function computeHydrostatics(config: SimConfig): HydroSnapshot {
  const heelRad = heelRadFromDeg(config.heelDeg)
  const hullEarthParts = hullEarthPartsForConfig(config, heelRad)
  const hullEarth = hullEarthParts[0] ?? []

  const refArea = designReferenceAreaForConfig(config)
  const { linearTotalKg, linearKeelKg } = linearLoadsFromConfig(config)
  const cg = computeCenterOfGravity(
    config.presetId,
    config.params,
    config.keelBallastId,
    refArea,
    linearTotalKg,
    linearKeelKg,
    config,
  )

  if (hullEarthParts.every((p) => p.length < 3)) {
    return fail({ hullEarthParts, hullEarth, heelRad }, 'Invalid hull outline')
  }

  if (cg.totalMassKg < 1e-3) {
    return fail(
      {
        hullEarthParts,
        hullEarth,
        heelRad,
        gX: cg.gX,
        gZ: cg.gZ,
        totalBoatMassKg: 0,
        vesselLengthM: config.vesselLengthM,
      },
      'No weight — enable loads',
    )
  }

  const submergedArea = cg.totalMassKg / RHO_SEAWATER

  const { zMin, zMax } = boundsZ(hullEarthParts)
  const maxResult = computeSubmergedMulti(hullEarthParts, zMax + 1)
  if (submergedArea > maxResult.area * 1.001) {
    return fail(
      {
        hullEarthParts,
        hullEarth,
        heelRad,
        gX: cg.gX,
        gZ: cg.gZ,
        totalBoatMassKg: config.totalBoatMassKg,
        vesselLengthM: config.vesselLengthM,
      },
      `Overloaded — max sectional area is ${maxResult.area.toFixed(2)} m²/m (${Math.round(RHO_SEAWATER * maxResult.area)} kg/m)`,
    )
  }

  const eq = findWaterlineForAreaMulti(hullEarthParts, submergedArea, zMin, zMax)
  if (!eq) {
    return fail(
      {
        hullEarthParts,
        hullEarth,
        heelRad,
        gX: cg.gX,
        gZ: cg.gZ,
        totalBoatMassKg: config.totalBoatMassKg,
        vesselLengthM: config.vesselLengthM,
      },
      'Cannot find equilibrium waterline',
    )
  }

  const { waterlineZ, result } = eq
  const { centroid: bEarth, area, submerged, segments, inertia } = result
  const bBody = earthToBody(bEarth, heelRad)

  const gBody: Vec2 = { x: cg.gX, z: cg.gZ }
  const gEarth = bodyToEarth(gBody, heelRad)
  const kEarth = bodyToEarth({ x: 0, z: 0 }, heelRad)

  const gEarthUpright = bodyToEarth(gBody, 0)
  const bEarthUpright = computeUprightBEarth(config) ?? bEarth

  const bm = area > 1e-9 ? inertia / area : 0
  const kb = bBody.z

  const clDir = centerlineDirection(heelRad)
  const clLen = Math.hypot(clDir.x, clDir.z) || 1
  const clUnit = { x: clDir.x / clLen, z: clDir.z / clLen }
  const mEarth: Vec2 = {
    x: bEarth.x + clUnit.x * bm,
    z: bEarth.z + clUnit.z * bm,
  }
  const mBody = earthToBody(mEarth, heelRad)

  const kg = cg.gZ
  const upright = computeUprightMetrics(config, cg.gZ)
  const gmUpright = upright?.gm ?? kb + bm - kg
  const kbUpright = upright?.kb ?? kb
  const bmUpright = upright?.bm ?? bm
  const m0BodyZ = kbUpright + bmUpright
  /** M₀ stays on the earth plumb line (original vertical) — lesson reference frame */
  const m0EarthPlumb: Vec2 = { x: 0, z: m0BodyZ }
  const m0Earth = bodyToEarth({ x: 0, z: m0BodyZ }, heelRad)

  const gz = bEarth.x - gEarth.x
  const gzApprox = gmUpright * Math.sin(heelRad)
  const approxErrorPct = computeApproxErrorPct(gz, gzApprox, config.heelDeg)

  const displacementKg = RHO_SEAWATER * area
  const weightKN = (displacementKg * G) / 1000
  const mr = weightKN * gz

  let ballastEarth: Vec2 | undefined
  if (config.keelBallastKg > 0) {
    const bp = ballastBodyPosition(config.params, config.presetId, config.keelBallastId, config)
    ballastEarth = bodyToEarth(bp, heelRad)
  }

  return {
    ok: true,
    heelRad,
    waterlineZ,
    area,
    bEarth,
    bBody,
    gEarth,
    mEarth,
    mBody,
    kEarth,
    kb,
    bm,
    kg,
    gm: gmUpright,
    gz,
    mr,
    weightKN,
    displacementKg,
    gzApprox,
    approxErrorPct,
    hullEarth,
    hullEarthParts,
    submergedEarth: submerged,
    waterlineSegments: segments,
    m0Earth,
    m0EarthPlumb,
    gmUpright,
    kbUpright,
    bmUpright,
    gX: cg.gX,
    gZ: cg.gZ,
    totalBoatMassKg: config.totalBoatMassKg,
    vesselLengthM: config.vesselLengthM,
    gEarthUpright,
    bEarthUpright,
    ballastEarth,
  }
}

/** @deprecated Use buildBoxBargeOutline from hull-presets */
export function buildBargeOutline(beam: number, depth: number): Vec2[] {
  return buildBoxBargeOutline({ beam, draft: depth, freeboard: 0, bilgeRadius: 0, finDepth: 0, keelThickness: 0, demiHullWidth: 0 })
}

export function computeBargeUprightBM(beam: number, submergedDepth: number): number {
  const h = beam / 2
  const area = beam * submergedDepth
  const i = (2 * h ** 3) / 3
  return i / area
}
