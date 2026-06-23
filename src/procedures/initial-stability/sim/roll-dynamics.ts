import { G } from './types'
import type { GzCurvePoint, Vec2 } from './types'

export type RollState = {
  thetaRad: number
  omegaRad: number
  timeS: number
}

export type MultihullHeaveMode = 'rigid' | 'jointed' | 'dynamic'

export type RollSimParams = {
  gmUpright: number
  displacementKg: number
  beam: number
  gzPoints: GzCurvePoint[]
  dampingRatio?: number
  waveHeightM?: number
  wavePeriodS?: number
  waveNoise?: number
  simSpeed?: number
  /** Multihull deck stabilization — reduces wave roll excitation */
  hullStabilizationStrength?: number
  hullStabilizationLimitM?: number
  /** Earth-frame x of each demi-hull center (for multihull heave) */
  hullCenterXsEarth?: number[]
  /** When set to rigid, adds a capped track-width roll boost on top of base excitation */
  multihullHeaveMode?: MultihullHeaveMode
  baseWlZ?: number
}

export type WaveVisualParams = {
  waveHeightM: number
  wavePeriodS: number
  waveNoise: number
  simSpeed: number
}

const DEG = Math.PI / 180
const G_WAVE = 9.81

/** Deep-water wavelength λ = gT² / (2π) */
export function waveLengthDeepWater(periodS: number): number {
  const T = Math.max(periodS, 0.5)
  return (G_WAVE * T * T) / (2 * Math.PI)
}

export function waveAngularFrequency(periodS: number): number {
  return (2 * Math.PI) / Math.max(periodS, 0.5)
}

export function waveFrequencyHz(periodS: number): number {
  return 1 / Math.max(periodS, 0.5)
}

/** Short chop harmonics scaled by the noise slider (0 = pure swell). */
const NOISE_HARMONICS = [
  { k: 5.2, omegaRatio: 2.6, phase: 0.63, weight: 0.42 },
  { k: 7.8, omegaRatio: 3.4, phase: 1.41, weight: 0.34 },
  { k: 11.3, omegaRatio: 1.8, phase: 2.17, weight: 0.24 },
] as const

function waveNoiseEta(xEarth: number, t: number, heightM: number, noise: number, omega: number): number {
  if (noise <= 0) return 0
  const scale = noise * heightM * 0.38
  let eta = 0
  for (const h of NOISE_HARMONICS) {
    eta += h.weight * Math.sin(h.k * xEarth - h.omegaRatio * omega * t + h.phase)
  }
  return scale * eta
}

/**
 * Chop slope for roll excitation — short waves ripple the surface visually but
 * couple weakly into roll (beam-averaged, capped vs swell).
 */
function waveNoiseSlopeForRoll(
  xEarth: number,
  t: number,
  heightM: number,
  noise: number,
  omega: number,
  beam: number,
): number {
  if (noise <= 0) return 0
  const scale = noise * noise * heightM * 0.38 * 0.1
  let slope = 0
  for (const h of NOISE_HARMONICS) {
    const kEff = h.k / (1 + h.k * Math.max(beam, 1) * 0.22)
    slope += h.weight * kEff * Math.cos(h.k * xEarth - h.omegaRatio * omega * t + h.phase)
  }
  return scale * slope
}

export function interpolateGz(heelDeg: number, points: GzCurvePoint[]): number {
  if (points.length === 0) return 0
  const d = Math.max(-180, Math.min(180, heelDeg))
  if (Math.abs(d) < 1e-9) return 0

  const sorted = [...points].sort((a, b) => a.heelDeg - b.heelDeg)
  if (d <= sorted[0].heelDeg) return sorted[0].gz
  if (d >= sorted[sorted.length - 1].heelDeg) return sorted[sorted.length - 1].gz

  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1]
    const b = sorted[i]
    if (d <= b.heelDeg) {
      const t = (d - a.heelDeg) / (b.heelDeg - a.heelDeg)
      return a.gz + t * (b.gz - a.gz)
    }
  }
  return sorted[sorted.length - 1].gz
}

/** Positive righting-arm magnitude for chart display. */
export function interpolateGzMagnitude(heelDeg: number, points: GzCurvePoint[]): number {
  return Math.abs(interpolateGz(heelDeg, points))
}

function restoringMoment(thetaRad: number, params: RollSimParams): number {
  const deg = (thetaRad * 180) / Math.PI
  const gz = interpolateGz(deg, params.gzPoints)
  return params.displacementKg * G * gz
}

function meanRigidHeaveM(t: number, params: RollSimParams): number {
  const wave: WaveVisualParams = {
    waveHeightM: params.waveHeightM ?? 0.35,
    wavePeriodS: params.wavePeriodS ?? 5,
    waveNoise: params.waveNoise ?? 0,
    simSpeed: params.simSpeed ?? 1,
  }
  const wl = params.baseWlZ ?? 0
  const xs = params.hullCenterXsEarth
  if (xs && xs.length > 1) {
    const locals = xs.map((x) => waveHeaveOffsetM(x, wl, t, wave))
    return locals.reduce((sum, h) => sum + h, 0) / locals.length
  }
  return waveHeaveOffsetM(0, wl, t, wave)
}

/** Swell-only surface offset at x (no chop — chop stays visual / weakly coupled). */
function swellHeaveOffsetM(xEarth: number, t: number, params: RollSimParams): number {
  const periodS = params.wavePeriodS ?? 5
  const heightM = params.waveHeightM ?? 0.35
  const simSpeed = params.simSpeed ?? 1
  const omega = waveAngularFrequency(periodS)
  const k = (2 * Math.PI) / waveLengthDeepWater(periodS)
  const amplitude = heightM / 2
  const phase = k * xEarth - omega * t * simSpeed
  return amplitude * Math.sin(phase)
}

/**
 * Small additive roll moment for rigid multihulls — port/starboard swell difference
 * across track width. Capped so big waves cannot overpower restoring/damping.
 */
function rigidMultihullTrackRollBoost(
  t: number,
  params: RollSimParams,
  baseMoment: number,
): number {
  if (params.multihullHeaveMode !== 'rigid') return 0

  const xs = params.hullCenterXsEarth
  if (!xs || xs.length < 2) return 0

  const swellHeaves = xs.map((x) => swellHeaveOffsetM(x, t, params))
  const meanHeave = swellHeaves.reduce((sum, h) => sum + h, 0) / swellHeaves.length

  let asym = 0
  for (let i = 0; i < xs.length; i++) {
    asym += (swellHeaves[i] - meanHeave) * xs[i]
  }
  asym /= xs.length

  const trackHalf = (Math.max(...xs) - Math.min(...xs)) / 2
  if (trackHalf < 0.15) return 0

  const wavelength = waveLengthDeepWater(params.wavePeriodS ?? 5)
  const trackFactor = Math.min(1, (2 * trackHalf) / Math.max(wavelength * 0.4, 1))

  const COUPLING = 0.052
  let boost = params.displacementKg * G * asym * COUPLING * trackFactor

  const gm = Math.max(params.gmUpright, 0.01)
  const absCap = params.displacementKg * G * gm * 0.2
  const relCap = Math.abs(baseMoment) * 0.42
  const cap = Math.min(absCap, Math.max(relCap, absCap * 0.12))

  return Math.max(-cap, Math.min(cap, boost))
}

/** Wave-slope excitation at hull center (beam seas, regular swell + optional chop). */
function waveExcitationMoment(t: number, params: RollSimParams): number {
  const periodS = params.wavePeriodS ?? 5
  const heightM = params.waveHeightM ?? 0.35
  const noise = params.waveNoise ?? 0
  const omega = waveAngularFrequency(periodS)
  const k = (2 * Math.PI) / waveLengthDeepWater(periodS)
  const amplitude = heightM / 2

  const swellSlope = amplitude * k * Math.cos(-omega * t)
  const chopSlope = waveNoiseSlopeForRoll(0, t, heightM, noise, omega, params.beam)
  const chopCap = amplitude * k * 0.28 * noise * noise
  const slope =
    swellSlope + Math.max(-chopCap, Math.min(chopCap, chopSlope))

  const stabFactor = hullStabilizationRollFactor(
    params.hullStabilizationStrength ?? 0,
    meanRigidHeaveM(t, params),
    params.hullStabilizationLimitM ?? 0.5,
  )

  const base =
    params.displacementKg * G * params.beam * 0.12 * slope * stabFactor

  return base + rigidMultihullTrackRollBoost(t, params, base)
}

/** One step of damped roll with wave excitation (sectional model, per m length). */
export function stepRoll(state: RollState, params: RollSimParams, dt: number): RollState {
  const speed = params.simSpeed ?? 1
  const dtScaled = dt * speed
  const k = 0.35 * params.beam
  const I = Math.max(params.displacementKg * k * k, params.displacementKg * 0.05)
  const gm = Math.max(params.gmUpright, 0.01)
  const zeta = params.dampingRatio ?? 0.07
  const B = 2 * zeta * Math.sqrt(I * params.displacementKg * G * gm)

  const restore = restoringMoment(state.thetaRad, params)
  const wave = waveExcitationMoment(state.timeS, params)
  const alpha = (-restore - B * state.omegaRad + wave) / I

  let omega = state.omegaRad + alpha * dtScaled
  let theta = state.thetaRad + omega * dtScaled
  const maxRad = 180 * DEG
  if (theta > maxRad) {
    theta = maxRad
    omega = Math.min(omega, 0)
  } else if (theta < -maxRad) {
    theta = -maxRad
    omega = Math.max(omega, 0)
  }

  return {
    thetaRad: theta,
    omegaRad: omega,
    timeS: state.timeS + dtScaled,
  }
}

/** Wavy free surface height in earth frame (m): regular traveling swell + optional chop. */
export function waveSurfaceZ(
  xEarth: number,
  baseWlZ: number,
  timeS: number,
  wave: WaveVisualParams = { waveHeightM: 0.35, wavePeriodS: 5, waveNoise: 0, simSpeed: 1 },
): number {
  const t = timeS * wave.simSpeed
  const periodS = Math.max(wave.wavePeriodS, 0.5)
  const omega = waveAngularFrequency(periodS)
  const k = (2 * Math.PI) / waveLengthDeepWater(periodS)
  const amplitude = wave.waveHeightM / 2

  const swell = amplitude * Math.sin(k * xEarth - omega * t)
  const chop = waveNoiseEta(xEarth, t, wave.waveHeightM, wave.waveNoise, omega)

  return baseWlZ + swell + chop
}

/** Vertical offset (m) so the hull rides the local wave surface at xEarth. */
export function waveHeaveOffsetM(
  xEarth: number,
  baseWlZ: number,
  timeS: number,
  wave?: WaveVisualParams,
): number {
  return waveSurfaceZ(xEarth, baseWlZ, timeS, wave) - baseWlZ
}

export type VesselHeaveLayout = {
  /** Mean vessel heave before active cancellation */
  rigidHeaveZ: number
  deckHeaveZ: number
  hullHeaveZs: number[]
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function resolveMultihullHeaveMode(
  dynamicHullStabilization: boolean,
  hullStabilizationStrength: number,
  jointedDeck: boolean,
): MultihullHeaveMode {
  if (dynamicHullStabilization && hullStabilizationStrength > 0) return 'dynamic'
  if (jointedDeck) return 'jointed'
  return 'rigid'
}

/** Rigid, jointed, or actively stabilized multihull heave layout. */
export function computeVesselHeaveLayout(
  hullCenterXs: number[],
  bEarthX: number,
  baseWlZ: number,
  timeS: number,
  wave: WaveVisualParams,
  mode: MultihullHeaveMode,
  stabilizationStrength: number,
  stabilizationLimitM: number,
): VesselHeaveLayout {
  const localHeaves = hullCenterXs.map((x) => waveHeaveOffsetM(x, baseWlZ, timeS, wave))
  const rigidHeave =
    hullCenterXs.length > 1
      ? localHeaves.reduce((sum, h) => sum + h, 0) / localHeaves.length
      : waveHeaveOffsetM(bEarthX, baseWlZ, timeS, wave)

  if (hullCenterXs.length <= 1) {
    return { rigidHeaveZ: rigidHeave, deckHeaveZ: rigidHeave, hullHeaveZs: [rigidHeave] }
  }

  if (mode === 'jointed') {
    return {
      rigidHeaveZ: rigidHeave,
      deckHeaveZ: rigidHeave,
      hullHeaveZs: [...localHeaves],
    }
  }

  if (mode === 'rigid') {
    return {
      rigidHeaveZ: rigidHeave,
      deckHeaveZ: rigidHeave,
      hullHeaveZs: hullCenterXs.map(() => rigidHeave),
    }
  }

  const s = clamp(stabilizationStrength, 0, 1)
  const limit = Math.max(0.05, stabilizationLimitM)
  const desiredCancel = rigidHeave * s
  const actualCancel = clamp(desiredCancel, -limit, limit)
  const deckHeaveZ = rigidHeave - actualCancel
  const hullHeaveZs = localHeaves.map((local) => rigidHeave + s * (local - rigidHeave))
  return { rigidHeaveZ: rigidHeave, deckHeaveZ, hullHeaveZs }
}

export const DECK_WAVE_CLEARANCE_M = 0.3

/** Minimum uniform heave (m) so body-frame points clear the wavy surface when shifted by heave. */
export function minUniformHeaveForClearance(
  pointsEarth: Vec2[],
  baseWlZ: number,
  timeS: number,
  wave: WaveVisualParams,
  clearanceM = DECK_WAVE_CLEARANCE_M,
): number {
  if (pointsEarth.length === 0) return 0
  let minHeave = -Infinity
  for (const p of pointsEarth) {
    const surface = waveSurfaceZ(p.x, baseWlZ, timeS, wave)
    minHeave = Math.max(minHeave, surface + clearanceM - p.z)
  }
  return Number.isFinite(minHeave) ? minHeave : 0
}

/** Raise both bridge ends equally until every platform point clears the waves. */
export function minPitchedBridgeHeavesForClearance(
  platformEarth: Vec2[],
  leftHeave: number,
  rightHeave: number,
  baseWlZ: number,
  timeS: number,
  wave: WaveVisualParams,
  clearanceM = DECK_WAVE_CLEARANCE_M,
): { leftHeave: number; rightHeave: number } {
  if (platformEarth.length === 0) return { leftHeave, rightHeave }

  const xs = platformEarth.map((p) => p.x)
  const xMin = Math.min(...xs)
  const xMax = Math.max(...xs)
  const span = xMax - xMin || 1

  let lH = leftHeave
  let rH = rightHeave
  for (let iter = 0; iter < 10; iter++) {
    let maxDeficit = 0
    for (const p of platformEarth) {
      const t = clamp((p.x - xMin) / span, 0, 1)
      const heave = lH + t * (rH - lH)
      const surface = waveSurfaceZ(p.x, baseWlZ, timeS, wave)
      maxDeficit = Math.max(maxDeficit, surface + clearanceM - (p.z + heave))
    }
    if (maxDeficit <= 0) break
    lH += maxDeficit
    rH += maxDeficit
  }
  return { leftHeave: lH, rightHeave: rH }
}

export type MultihullDeckHeaveState = VesselHeaveLayout & {
  /** Extra deck lift applied so the platform stays above waves */
  dryDeckBoostM: number
}

/** Keep multihull deck / bridge platforms above the wavy free surface (dynamic stab only). */
export function enforceMultihullDryDeck(
  layout: VesselHeaveLayout,
  _bridgePlatformsEarth: Vec2[][],
  _bridgeHullPairs: [number, number][],
  hullCenterXs: number[],
  hullDeckTopZsEarth: number[],
  baseWlZ: number,
  timeS: number,
  wave: WaveVisualParams,
  mode: MultihullHeaveMode,
): MultihullDeckHeaveState {
  if (mode !== 'dynamic') {
    return { ...layout, dryDeckBoostM: 0 }
  }

  const hullHeaveZs = [...layout.hullHeaveZs]
  let deckHeaveZ = layout.deckHeaveZ
  let dryDeckBoostM = 0

  const clearancePts: Vec2[] = [
    ..._bridgePlatformsEarth.flat(),
    ...hullCenterXs.map((x, i) => ({ x, z: hullDeckTopZsEarth[i] })),
  ]

  for (let i = 0; i < hullCenterXs.length; i++) {
    const surface = waveSurfaceZ(hullCenterXs[i], baseWlZ, timeS, wave)
    const minHullHeave = surface + DECK_WAVE_CLEARANCE_M - hullDeckTopZsEarth[i]
    if (minHullHeave > hullHeaveZs[i]) hullHeaveZs[i] = minHullHeave
  }

  const minDeck = minUniformHeaveForClearance(clearancePts, baseWlZ, timeS, wave)
  if (minDeck > deckHeaveZ) {
    dryDeckBoostM = minDeck - deckHeaveZ
    deckHeaveZ = minDeck
  }

  return {
    rigidHeaveZ: layout.rigidHeaveZ,
    deckHeaveZ,
    hullHeaveZs,
    dryDeckBoostM,
  }
}

/** Roll excitation reduction when deck is actively stabilized (gyros / ride control). */
export function hullStabilizationRollFactor(
  strength: number,
  rigidHeaveM: number,
  stabilizationLimitM: number,
): number {
  const s = clamp(strength, 0, 1)
  if (s <= 0) return 1
  const limit = Math.max(0.05, stabilizationLimitM)
  const desired = Math.abs(rigidHeaveM * s)
  const saturation = desired > 1e-6 ? Math.min(1, limit / desired) : 1
  return 1 - s * 0.72 * saturation
}

export function buildWaveSurfacePoints(
  view: { flip: (x: number, z: number) => { sx: number; sy: number } },
  baseWlZ: number,
  timeS: number,
  wave?: WaveVisualParams,
  xExtent = 45,
  step = 0.35,
): { sx: number; sy: number }[] {
  const pts: { sx: number; sy: number }[] = []
  for (let x = -xExtent; x <= xExtent; x += step) {
    pts.push(view.flip(x, waveSurfaceZ(x, baseWlZ, timeS, wave)))
  }
  return pts
}

export function buildWaveWaterPath(
  view: { flip: (x: number, z: number) => { sx: number; sy: number } },
  baseWlZ: number,
  timeS: number,
  wave?: WaveVisualParams,
  xExtent = 45,
  step = 0.35,
  zDeepEarth?: number,
): string {
  const top = buildWaveSurfacePoints(view, baseWlZ, timeS, wave, xExtent, step)
  const zDeep = zDeepEarth ?? baseWlZ - 25
  const bl = view.flip(-xExtent, zDeep)
  const br = view.flip(xExtent, zDeep)
  let d = `M ${top[0].sx.toFixed(1)} ${top[0].sy.toFixed(1)}`
  for (let i = 1; i < top.length; i++) {
    d += ` L ${top[i].sx.toFixed(1)} ${top[i].sy.toFixed(1)}`
  }
  d += ` L ${br.sx.toFixed(1)} ${br.sy.toFixed(1)} L ${bl.sx.toFixed(1)} ${bl.sy.toFixed(1)} Z`
  return d
}

export function buildWaveSurfaceLine(
  view: { flip: (x: number, z: number) => { sx: number; sy: number } },
  baseWlZ: number,
  timeS: number,
  wave?: WaveVisualParams,
  xExtent = 45,
  step = 0.35,
): string {
  const pts = buildWaveSurfacePoints(view, baseWlZ, timeS, wave, xExtent, step)
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ')
}

/** Closed clip region above the wavy free surface (for hull topsides). */
export function buildWaveAboveClipPath(
  view: { flip: (x: number, z: number) => { sx: number; sy: number } },
  baseWlZ: number,
  timeS: number,
  topEarthZ: number,
  wave?: WaveVisualParams,
  xExtent = 45,
  step = 0.35,
): string {
  const surface = buildWaveSurfacePoints(view, baseWlZ, timeS, wave, xExtent, step)
  const tl = view.flip(-xExtent, topEarthZ)
  const tr = view.flip(xExtent, topEarthZ)
  let d = `M ${surface[0].sx.toFixed(1)} ${surface[0].sy.toFixed(1)}`
  for (let i = 1; i < surface.length; i++) {
    d += ` L ${surface[i].sx.toFixed(1)} ${surface[i].sy.toFixed(1)}`
  }
  d += ` L ${tr.sx.toFixed(1)} ${tr.sy.toFixed(1)} L ${tl.sx.toFixed(1)} ${tl.sy.toFixed(1)} Z`
  return d
}
