import type { HullParams, HullPresetId, KeelBallastId, SimConfig } from './types'
import { RHO_SEAWATER } from './types'
import { ballastBodyPosition } from './keel-config'
import { designReferenceAreaForConfig } from './keel-config'

export interface CenterOfGravityResult {
  gX: number
  gZ: number
  totalMassKg: number
  displacementKg: number
}

export const DEFAULT_VESSEL_LENGTH_M = 12

/** LWL slider and store bounds (m). */
export const MIN_VESSEL_LENGTH_M = 1
export const MAX_VESSEL_LENGTH_M = 100

export function clampVesselLengthM(m: number): number {
  return Math.max(MIN_VESSEL_LENGTH_M, Math.min(MAX_VESSEL_LENGTH_M, m))
}

/** Maximum total boat mass exposed in controls (covers largest hull design displacement at default LWL). */
export const MAX_TOTAL_BOAT_MASS_KG = 120_000

export function clampTotalBoatMassKg(kg: number, maxKg = MAX_TOTAL_BOAT_MASS_KG): number {
  return Math.max(0, Math.min(maxKg, kg))
}

/** Weight slider upper bound — extends past 120 t when design displacement requires it. */
export function weightSliderMaxKg(config: SimConfig): number {
  return Math.max(
    MAX_TOTAL_BOAT_MASS_KG,
    defaultTotalBoatMassKg(config),
    config.totalBoatMassKg,
  )
}

export function displacementMassKg(submergedArea: number): number {
  return RHO_SEAWATER * submergedArea
}

/** Strip-model mass (kg/m) from total boat mass and length. */
export function linearMassKgPerM(totalBoatMassKg: number, vesselLengthM: number): number {
  return totalBoatMassKg / clampVesselLengthM(vesselLengthM)
}

/** Per-meter loads for the 2D cross-section solver. */
export function linearLoadsFromConfig(config: SimConfig): {
  linearTotalKg: number
  linearKeelKg: number
} {
  const len = clampVesselLengthM(config.vesselLengthM)
  return {
    linearTotalKg: config.totalBoatMassKg / len,
    linearKeelKg: config.keelBallastKg / len,
  }
}

/** Default loaded mass at design waterline (kg/m). */
export function defaultTotalMassKg(referenceArea: number): number {
  return displacementMassKg(referenceArea)
}

/** Design displacement for the whole boat at reference draft (kg). */
export function defaultTotalBoatMassKg(config: SimConfig): number {
  const refArea = designReferenceAreaForConfig(config)
  return defaultTotalMassKg(refArea) * clampVesselLengthM(config.vesselLengthM)
}

/** Typical keel ballast mass as a fraction of design displacement (kg/m). */
export function defaultKeelBallastMassKg(referenceArea: number, keelId: KeelBallastId): number {
  if (keelId === 'none') return 0
  return displacementMassKg(referenceArea) * 0.18
}

/** Typical total keel ballast mass (kg). */
export function defaultKeelBallastKg(config: SimConfig, keelId: KeelBallastId = config.keelBallastId): number {
  const refArea = designReferenceAreaForConfig(config)
  return defaultKeelBallastMassKg(refArea, keelId) * clampVesselLengthM(config.vesselLengthM)
}

/** Set total (and default keel) mass so the hull floats at its design waterline. */
export function withDesignDisplacement(config: SimConfig): SimConfig {
  const designMass = defaultTotalBoatMassKg(config)
  const maxKg = weightSliderMaxKg({ ...config, totalBoatMassKg: designMass })
  const totalBoatMassKg = clampTotalBoatMassKg(designMass, maxKg)
  const keelBallastKg =
    config.keelBallastId === 'none'
      ? 0
      : Math.min(defaultKeelBallastKg(config), totalBoatMassKg)
  return { ...config, totalBoatMassKg, keelBallastKg }
}

/** Lightship / hull structure centroid (body frame, from K). */
export function hullStructureKg(params: HullParams): number {
  const { draft, freeboard } = params
  const deckZ = draft + freeboard
  if (deckZ < 1e-6) return 0
  const belowWlCg = draft * 0.42
  const topsideCg = draft + freeboard * 0.58
  const belowWlMassFrac = 0.55 + 0.25 * (draft / deckZ)
  return belowWlMassFrac * belowWlCg + (1 - belowWlMassFrac) * topsideCg
}

function ballastKgPosition(
  presetId: HullPresetId,
  params: HullParams,
  keelId: KeelBallastId,
  config?: SimConfig,
): number {
  const id = keelId === 'none' ? 'internal' : keelId
  return ballastBodyPosition(params, presetId, id, config).z
}

/**
 * Center of gravity from strip-model mass (kg/m), optional keel ballast (kg/m), and layout.
 * Keel appendage geometry does not lower G unless keel ballast mass is added.
 */
export function computeCenterOfGravity(
  presetId: HullPresetId,
  params: HullParams,
  keelId: KeelBallastId,
  referenceArea: number,
  totalMassKg: number,
  keelBallastMassKg: number,
  config?: SimConfig,
): CenterOfGravityResult {
  const displacementKg = displacementMassKg(referenceArea)
  const keelMass = Math.min(Math.max(0, keelBallastMassKg), totalMassKg)
  const hullMass = Math.max(0, totalMassKg - keelMass)
  const kgHull = hullStructureKg(params)

  let gZ: number
  if (keelMass < 1e-3) {
    gZ = kgHull
  } else {
    const kgBallast = ballastKgPosition(presetId, params, keelId, config)
    gZ = (hullMass * kgHull + keelMass * kgBallast) / totalMassKg
  }

  return {
    gX: 0,
    gZ,
    totalMassKg,
    displacementKg,
  }
}
