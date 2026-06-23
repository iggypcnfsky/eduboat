import { getCustomHullDesign } from '../customHullStore'
import {
  customKeelBallastCentroid,
  hasCustomKeelAppendage,
  sampleCustomHullOutline,
  type CustomHullDesign,
} from './custom-hull'
import {
  applyKeelDatumParts,
  buildBulbKeelOutline,
  buildFinKeelOutline,
  buildFullKeelOutline,
  buildHullOutline,
  buildHullParts,
  buildRoundBilgeOutline,
  hullKeelZ,
  hullKeelZParts,
  isCustomHullPreset,
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
    id: 'custom-keel',
    title: 'Custom keel',
    description: 'Lower hull region labeled in your design — same hull section, ballast can sit in the keel zone.',
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
  if (keelId === 'none' || keelId === 'internal' || keelId === 'custom-keel') return p

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

/** Keel appendage options allowed for user-drawn hull outlines (excludes custom-keel — use when drawn). */
export const CUSTOM_HULL_KEEL_IDS: KeelBallastId[] = KEEL_BALLAST_OPTIONS.filter((k) => k.id !== 'custom-keel').map(
  (k) => k.id,
)

export function isCustomHullKeelAllowed(id: KeelBallastId): boolean {
  return CUSTOM_HULL_KEEL_IDS.includes(id) || id === 'custom-keel'
}

/** Pick appendage type when loading or saving a custom hull design. */
export function resolveCustomHullKeelBallastId(
  design: CustomHullDesign,
  prevKeelBallastId: KeelBallastId,
): KeelBallastId {
  if (hasCustomKeelAppendage(design)) return 'custom-keel'
  if (prevKeelBallastId === 'custom-keel') return 'internal'
  return isCustomHullKeelAllowed(prevKeelBallastId) ? prevKeelBallastId : 'internal'
}

function mirrorPortStarboard(starboard: Vec2[]): Vec2[] {
  const port: Vec2[] = []
  for (let i = starboard.length - 2; i >= 1; i--) {
    port.push({ x: -starboard[i].x, z: starboard[i].z })
  }
  return port
}

function closeStarboardOutline(starboard: Vec2[]): Vec2[] {
  if (starboard.length < 2) return starboard
  const port = mirrorPortStarboard(starboard)
  return [...starboard, ...port, { ...starboard[0] }]
}

function buildKeelAppendageStarboard(
  keelId: KeelBallastId,
  keelZ: number,
  p: HullParams,
): Vec2[] | null {
  const finHalf = Math.max(p.keelThickness / 2, 0.05)
  const trunkHalf = Math.max(p.keelThickness * 0.6, 0.06)

  switch (keelId) {
    case 'bulb': {
      const tipZ = keelZ - p.finDepth
      const bulbHalf = finHalf * 1.55
      const bulbBottomZ = tipZ - p.finDepth * 0.1
      return [
        { x: 0, z: bulbBottomZ },
        { x: bulbHalf, z: tipZ - p.finDepth * 0.06 },
        { x: bulbHalf, z: tipZ + p.finDepth * 0.08 },
        { x: finHalf, z: tipZ + p.finDepth * 0.22 },
        { x: finHalf * 0.9, z: tipZ + p.finDepth * 0.55 },
        { x: finHalf * 0.45, z: keelZ },
        { x: 0, z: keelZ },
      ]
    }
    case 'fin': {
      const tipZ = keelZ - p.finDepth
      return [
        { x: 0, z: tipZ },
        { x: finHalf, z: tipZ + p.finDepth * 0.22 },
        { x: finHalf * 0.9, z: tipZ + p.finDepth * 0.55 },
        { x: finHalf * 0.45, z: keelZ },
        { x: 0, z: keelZ },
      ]
    }
    case 'full-keel': {
      const shoeZ = keelZ - Math.max(p.finDepth, 0.05)
      const keelHalf = Math.max(p.keelThickness / 2, 0.05)
      return [
        { x: 0, z: shoeZ },
        { x: keelHalf, z: shoeZ + p.finDepth * 0.35 },
        { x: keelHalf, z: keelZ },
        { x: 0, z: keelZ },
      ]
    }
    case 'centerboard': {
      const depth = p.finDepth
      const boardHalf = trunkHalf * 0.45
      return [
        { x: 0, z: keelZ },
        { x: trunkHalf, z: keelZ - depth * 0.12 },
        { x: trunkHalf, z: keelZ - depth * 0.35 },
        { x: boardHalf, z: keelZ - depth * 0.4 },
        { x: boardHalf, z: keelZ - depth },
        { x: 0, z: keelZ - depth },
      ]
    }
    default:
      return null
  }
}

/** Keel appendage only — does not modify the user-drawn hull polygon. */
export function buildCustomKeelAppendagePart(
  hullOutline: Vec2[],
  keelId: KeelBallastId,
  params: HullParams,
): Vec2[] | null {
  if (keelId === 'none' || keelId === 'internal' || keelId === 'custom-keel') return null
  if (hullOutline.length < 3) return null

  const p = resolveKeelParams(params, keelId)
  const keelZ = hullKeelZ(hullOutline)
  const starboard = buildKeelAppendageStarboard(keelId, keelZ, p)
  if (!starboard) return null
  return closeStarboardOutline(starboard)
}

/** Part index of a parametric keel layer for custom hulls (drawn keel labels stay on the main hull). */
export function customHullKeelPartIndex(config: SimConfig): number | null {
  if (!isCustomHullPreset(config.presetId)) return null
  if (
    config.keelBallastId === 'none' ||
    config.keelBallastId === 'internal' ||
    config.keelBallastId === 'custom-keel'
  ) {
    return null
  }
  return 1
}

/** One or more hull sections — catamaran / trimaran return multiple demi-hulls. */
export function buildHullPartsForConfig(config: SimConfig): Vec2[][] {
  const { presetId, keelBallastId } = config
  if (isCustomHullPreset(presetId)) {
    const design = getCustomHullDesign(config.customHullId)
    if (!design) return [[]]
    const hull = sampleCustomHullOutline(design)
    if (keelBallastId === 'none' || keelBallastId === 'internal' || keelBallastId === 'custom-keel') {
      return [hull]
    }
    const parametricKeel = buildCustomKeelAppendagePart(hull, keelBallastId, config.params)
    return parametricKeel ? [hull, parametricKeel] : [hull]
  }
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
  config?: SimConfig,
): Vec2 {
  const p = resolveKeelParams(params, keelId)
  switch (keelId) {
    case 'custom-keel': {
      if (config?.customHullId) {
        const design = getCustomHullDesign(config.customHullId)
        if (design) {
          const centroid = customKeelBallastCentroid(design)
          if (centroid) return centroid
        }
      }
      return { x: 0, z: p.draft * 0.15 }
    }
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

/** Design waterline in body frame after keel datum (K at deepest point). */
export function designWaterlineZ(config: SimConfig): number {
  const parts = buildHullPartsForConfig(config)
  const keelZ = hullKeelZParts(parts)
  if (isCustomHullPreset(config.presetId) && config.customHullId) {
    const design = getCustomHullDesign(config.customHullId)
    if (design) return design.designWaterlineZ - keelZ
  }
  return config.params.draft - keelZ
}

/** Design reference area at mean draft for weight scaling (includes keel geometry). */
export function designReferenceAreaForConfig(config: SimConfig): number {
  const parts = applyKeelDatumParts(buildHullPartsForConfig(config))
  const hullEarthParts = parts.map((p) => bodyToEarthOutline(p, 0))
  const wlZ = designWaterlineZ(config)
  const { area } = computeSubmergedMulti(hullEarthParts, wlZ)
  return Math.max(0.1, area)
}
