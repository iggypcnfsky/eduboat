import {
  applyKeelDatumParts,
  buildBulbKeelOutline,
  buildFinKeelOutline,
  buildFullKeelOutline,
  buildHullOutline,
  buildHullParts,
  buildRoundBilgeOutline,
  hullKeelZParts,
  isMultiHullPreset,
} from './hull-presets'
import { bodyToEarthOutline, computeSubmergedMulti } from './geometry'
import type { HullParams, HullPresetId, KeelBallastId, SimConfig, Vec2 } from './types'

export interface KeelBallastOption {
  id: KeelBallastId
  title: string
  description: string
  /** Extra hull params exposed when this keel type is selected */
  visibleParams: (keyof HullParams)[]
}

export const KEEL_BALLAST_OPTIONS: KeelBallastOption[] = [
  {
    id: 'none',
    title: 'No keel appendage',
    description: 'Bare hull section — ballast (if enabled) sits in the bilge.',
    visibleParams: [],
  },
  {
    id: 'internal',
    title: 'Internal ballast',
    description: 'Lead or iron inside the hull bilge — no external keel shape.',
    visibleParams: [],
  },
  {
    id: 'fin',
    title: 'Fin keel',
    description: 'Deep narrow fin — lowers G and adds wetted surface below the hull.',
    visibleParams: ['finDepth', 'keelThickness'],
  },
  {
    id: 'bulb',
    title: 'Bulb keel',
    description: 'Fin keel with a dense bulb at the tip for maximum righting leverage.',
    visibleParams: ['finDepth', 'keelThickness'],
  },
  {
    id: 'full-keel',
    title: 'Full long keel',
    description: 'Traditional long keel shoe — very stable, shallow bilge entry.',
    visibleParams: ['keelThickness', 'finDepth'],
  },
  {
    id: 'centerboard',
    title: 'Centerboard / daggerboard',
    description: 'Retractable board in a trunk — moderate draft when down.',
    visibleParams: ['finDepth', 'keelThickness'],
  },
]

export function getKeelBallastOption(id: KeelBallastId): KeelBallastOption {
  return KEEL_BALLAST_OPTIONS.find((k) => k.id === id) ?? KEEL_BALLAST_OPTIONS[0]
}

export function resolveKeelParams(params: HullParams, keelId: KeelBallastId): HullParams {
  const p = { ...params }
  if (keelId === 'none' || keelId === 'internal') return p

  if (keelId === 'full-keel') {
    p.finDepth = p.finDepth > 0.1 ? p.finDepth : p.draft * 0.15
    p.keelThickness = p.keelThickness > 0.1 ? p.keelThickness : Math.min(p.beam * 0.12, 0.55)
    return p
  }

  if (keelId === 'centerboard') {
    p.finDepth = p.finDepth > 0.1 ? p.finDepth : p.draft * 0.55
    p.keelThickness = p.keelThickness > 0.1 ? p.keelThickness : 0.08
    return p
  }

  // fin / bulb
  p.finDepth = p.finDepth > 0.1 ? p.finDepth : p.draft * 0.48
  p.keelThickness = p.keelThickness > 0.1 ? p.keelThickness : Math.min(p.beam * 0.08, 0.32)
  return p
}

function finOutlineForPreset(presetId: HullPresetId, p: HullParams): Vec2[] {
  if (presetId === 'fin-keel') return buildFinKeelOutline(p)
  return buildFinKeelOutline({
    ...p,
    bilgeRadius: p.bilgeRadius || Math.min(p.beam * 0.12, 0.5),
  })
}

function buildCenterboardOutline(presetId: HullPresetId, p: HullParams): Vec2[] {
  const base = presetId === 'round-bilge' ? buildRoundBilgeOutline(p) : buildHullOutline(presetId, p)
  const depth = p.finDepth
  const trunkHalf = Math.max(p.keelThickness * 0.6, 0.06)
  const boardHalf = trunkHalf * 0.45
  const keelZ = Math.min(...base.map((pt) => pt.z))

  const trunkAndBoard: Vec2[] = [
    { x: 0, z: keelZ },
    { x: trunkHalf, z: keelZ - depth * 0.12 },
    { x: trunkHalf, z: keelZ - depth * 0.35 },
    { x: boardHalf, z: keelZ - depth * 0.4 },
    { x: boardHalf, z: keelZ - depth },
    { x: 0, z: keelZ - depth },
  ]

  const deckZ = Math.max(...base.map((pt) => pt.z))
  const sbUpper = base.filter((pt) => pt.x > trunkHalf + 0.02 && pt.z > keelZ + 0.05)
  const chain = [...trunkAndBoard, ...sbUpper, { x: 0, z: deckZ }]
  const port = chain
    .slice(1, -1)
    .filter((pt) => pt.x > 0.01)
    .map((pt) => ({ x: -pt.x, z: pt.z }))
    .reverse()
  return [...chain, ...port, chain[0]]
}

/** Build hull cross-section including keel / ballast geometry for the selected config. */
export function buildHullOutlineForConfig(config: SimConfig): Vec2[] {
  return buildHullPartsForConfig(config)[0] ?? []
}

/** One or more hull sections — catamaran / trimaran return multiple demi-hulls. */
export function buildHullPartsForConfig(config: SimConfig): Vec2[][] {
  const { presetId, keelBallastId } = config
  if (isMultiHullPreset(presetId)) {
    return buildHullParts(presetId, config.params)
  }

  const p = resolveKeelParams(config.params, keelBallastId)

  switch (keelBallastId) {
    case 'fin':
      return [finOutlineForPreset(presetId, p)]
    case 'bulb':
      return [buildBulbKeelOutline(p)]
    case 'full-keel':
      if (presetId === 'full-keel') return [buildFullKeelOutline(p)]
      return [
        buildFullKeelOutline({
          ...p,
          bilgeRadius: p.bilgeRadius || Math.min(p.beam * 0.14, 0.55),
        }),
      ]
    case 'centerboard':
      return [buildCenterboardOutline(presetId, p)]
    default:
      return [buildHullOutline(presetId, config.params)]
  }
}

/** Ballast centroid in body frame (from K) for the active keel type. */
export function ballastBodyPosition(
  params: HullParams,
  presetId: HullPresetId,
  keelId: KeelBallastId,
): Vec2 {
  const p = resolveKeelParams(params, keelId)
  switch (keelId) {
    case 'fin':
    case 'bulb': {
      const tipZ = -p.finDepth
      const z = keelId === 'bulb' ? tipZ - p.finDepth * 0.04 : Math.max(p.finDepth * 0.15, 0.08)
      return { x: 0, z }
    }
    case 'full-keel':
      return { x: 0, z: p.draft * 0.1 + p.finDepth * 0.15 }
    case 'centerboard':
      return { x: 0, z: p.draft * 0.22 }
    case 'internal':
      return { x: 0, z: p.draft * 0.38 }
    default:
      if (presetId === 'fin-keel') return { x: 0, z: Math.max(p.finDepth * 0.15, 0.08) }
      if (presetId === 'full-keel') return { x: 0, z: p.draft * 0.12 }
      return { x: 0, z: p.draft * 0.24 }
  }
}

/** Polygon approximating ballast mass block for diagram (body frame). */
export function ballastBlockOutline(params: HullParams, keelId: KeelBallastId): Vec2[] {
  const p = resolveKeelParams(params, keelId)
  const c = ballastBodyPosition(p, 'round-bilge', keelId)
  const w = Math.max(p.keelThickness * 0.9, p.beam * 0.06, 0.2)
  const h = Math.max(p.finDepth * 0.22, p.draft * 0.08, 0.12)
  return [
    { x: c.x - w / 2, z: c.z - h / 2 },
    { x: c.x + w / 2, z: c.z - h / 2 },
    { x: c.x + w / 2, z: c.z + h / 2 },
    { x: c.x - w / 2, z: c.z + h / 2 },
  ]
}

/** Design waterline in body frame after keel datum (K at deepest point). Draft is measured from hull bottom; fin adds depth below. */
export function designWaterlineZ(config: SimConfig): number {
  const parts = buildHullPartsForConfig(config)
  return config.params.draft - hullKeelZParts(parts)
}

/** Design reference area at mean draft for weight scaling (includes keel geometry). */
export function designReferenceAreaForConfig(config: SimConfig): number {
  const parts = applyKeelDatumParts(buildHullPartsForConfig(config))
  const hullEarthParts = parts.map((p) => bodyToEarthOutline(p, 0))
  const wlZ = designWaterlineZ(config)
  const { area } = computeSubmergedMulti(hullEarthParts, wlZ)
  return Math.max(0.1, area)
}
