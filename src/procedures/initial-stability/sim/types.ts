export type Vec2 = { x: number; z: number }

export type HullPresetId =
  | 'classical-u'
  | 'box-barge'
  | 'round-bilge'
  | 'fin-keel'
  | 'full-keel'
  | 'catamaran'
  | 'trimaran'
  | 'custom'

export type KeelBallastId =
  | 'none'
  | 'internal'
  | 'custom-keel'
  | 'fin'
  | 'bulb'
  | 'full-keel'
  | 'centerboard'

export interface HullParams {
  beam: number
  draft: number
  freeboard: number
  bilgeRadius: number
  finDepth: number
  keelThickness: number
  demiHullWidth: number
}

export interface SimConfig {
  presetId: HullPresetId
  /** Active user-drawn hull when presetId is "custom". */
  customHullId: string | null
  /** Selected boat-class template, or "custom" after manual edits */
  templateId: string
  params: HullParams
  keelBallastId: KeelBallastId
  /** Heel angle in degrees (starboard positive) */
  heelDeg: number
  /** Waterline length — converts total boat mass to 2D strip model (kg/m) */
  vesselLengthM: number
  /** Total vessel displacement mass (kg) */
  totalBoatMassKg: number
  /** Total keel / ballast mass on the boat (kg) */
  keelBallastKg: number
  /** Wave roll simulation */
  waveHeightM: number
  wavePeriodS: number
  /** 0 = regular swell only; 1 = full chop / irregularity overlay */
  waveNoise: number
  simSpeed: number
  dampingRatio: number
  /** Multihull only: active ride control — deck stays level, hulls decoupled */
  dynamicHullStabilization: boolean
  /** Multihull only: deck pinned to each hull on joints (passive pitch, no actuators) */
  jointedDeck: boolean
  /** 0 = rigid vessel; 1 = full deck isolation + independent hull heave */
  hullStabilizationStrength: number
  /** Max vertical stroke (m) of active stabilizers / actuators */
  hullStabilizationLimitM: number
  /** Kinematic transverse orbital motion during wave animation (visual only) */
  waveSwayEnabled: boolean
}

export interface HydroSnapshot {
  ok: boolean
  error?: string
  /** Heel angle used (rad) */
  heelRad: number
  /** Waterline height in earth frame (m) */
  waterlineZ: number
  /** Submerged area achieved (m²) */
  area: number
  /** Center of buoyancy in earth frame */
  bEarth: Vec2
  /** Center of buoyancy in body frame */
  bBody: Vec2
  /** G in earth frame */
  gEarth: Vec2
  /** Instantaneous metacenter (internal / large-angle); display uses m0EarthPlumb only */
  mEarth: Vec2
  /** Metacenter in body frame */
  mBody: Vec2
  /** K in earth frame */
  kEarth: Vec2
  kb: number
  bm: number
  kg: number
  gm: number
  gz: number
  /** Righting moment in kN·m (W × GZ) */
  mr: number
  /** Displacement weight in kN (ρ g A) */
  weightKN: number
  /** Displacement mass in kg */
  displacementKg: number
  /** GZ from GM·sin(θ) approximation at upright GM */
  gzApprox: number
  /** Percent error of approximation */
  approxErrorPct: number
  /** Rotated hull outline in earth frame (first hull — legacy) */
  hullEarth: Vec2[]
  /** All hull outlines in earth frame (catamaran / trimaran show multiple) */
  hullEarthParts: Vec2[][]
  /** Submerged polygon in earth frame */
  submergedEarth: Vec2[]
  /** Waterline x-intervals at waterlineZ in earth frame */
  waterlineSegments: [number, number][]
  /** Upright metacenter on earth plumb line (x=0, z=KB+BM) — fixed while heeling */
  m0EarthPlumb: Vec2
  /** @deprecated Rotated M₀ — use m0EarthPlumb for display */
  m0Earth: Vec2
  /** Upright GM for decomposition display */
  gmUpright: number
  kbUpright: number
  bmUpright: number
  /** Computed center of gravity (body frame, from K) */
  gX: number
  gZ: number
  /** Total vessel mass (kg) */
  totalBoatMassKg: number
  /** Waterline length used for strip-model conversion */
  vesselLengthM: number
  /** Upright (θ=0) G and B in earth frame — ghost reference when heeled */
  gEarthUpright: Vec2
  bEarthUpright: Vec2
  /** Ballast block centroid in earth frame when ballast load is on */
  ballastEarth?: Vec2
}

export interface GzCurvePoint {
  heelDeg: number
  gz: number
  gzApprox: number
}

export interface GzCurve {
  points: GzCurvePoint[]
  maxGz: number
  maxGzAtDeg: number
  vanishingStabilityDeg: number | null
  gmUpright: number
}

export const RHO_SEAWATER = 1025
export const G = 9.81
