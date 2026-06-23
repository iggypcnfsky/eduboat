import { bodyToEarth, bodyToEarthOutline, computeSubmerged, computeSubmergedMulti } from './geometry'
import { buildClassicalUOutline } from './classical-u-path'
import type { HullParams, HullPresetId, Vec2 } from './types'

export interface HullPresetDef {
  id: HullPresetId
  title: string
  description: string
  defaultParams: HullParams
  paramRanges: Record<keyof HullParams, { min: number; max: number; step: number; label: string }>
  /** Which params are shown for this preset */
  visibleParams: (keyof HullParams)[]
  /** Override shared param labels for this preset */
  paramLabels?: Partial<Record<keyof HullParams, string>>
}

const SHARED_RANGES: HullPresetDef['paramRanges'] = {
  beam: { min: 2.4, max: 18.0, step: 0.1, label: 'Beam (m)' },
  draft: { min: 0.8, max: 9.0, step: 0.05, label: 'Draft (m)' },
  freeboard: { min: 0.4, max: 5.4, step: 0.05, label: 'Freeboard (m)' },
  bilgeRadius: { min: 0.15, max: 3.0, step: 0.05, label: 'Bilge radius (m)' },
  finDepth: { min: 0.1, max: 4.8, step: 0.05, label: 'Fin depth (m)' },
  keelThickness: { min: 0.2, max: 2.4, step: 0.05, label: 'Keel thickness (m)' },
  demiHullWidth: { min: 0.8, max: 6.6, step: 0.05, label: 'Demi-hull width (m)' },
}

export const HULL_PRESETS: HullPresetDef[] = [
  {
    id: 'classical-u',
    title: 'Classical U-section',
    description: 'Textbook U-section from lesson SVG — wide bilge, flared topsides.',
    defaultParams: {
      beam: 7.5,
      draft: 1.25,
      freeboard: 0.65,
      bilgeRadius: 0,
      finDepth: 0,
      keelThickness: 0,
      demiHullWidth: 0,
    },
    visibleParams: ['beam', 'draft', 'freeboard'],
    paramRanges: SHARED_RANGES,
  },
  {
    id: 'box-barge',
    title: 'Box barge',
    description: 'Wall-sided rectangular section — classic stability textbook hull.',
    defaultParams: {
      beam: 4.0,
      draft: 2.0,
      freeboard: 0.8,
      bilgeRadius: 0,
      finDepth: 0,
      keelThickness: 0,
      demiHullWidth: 0,
    },
    visibleParams: ['beam', 'draft', 'freeboard'],
    paramRanges: SHARED_RANGES,
  },
  {
    id: 'round-bilge',
    title: 'Round bilge',
    description: 'Generic symmetric displacement hull with curved bilges.',
    defaultParams: {
      beam: 3.8,
      draft: 1.9,
      freeboard: 1.0,
      bilgeRadius: 0.55,
      finDepth: 0,
      keelThickness: 0,
      demiHullWidth: 0,
    },
    visibleParams: ['beam', 'draft', 'freeboard', 'bilgeRadius'],
    paramRanges: SHARED_RANGES,
  },
  {
    id: 'fin-keel',
    title: 'Fin-keel yacht',
    description: 'Modern sailing yacht with deep fin keel and moderate beam.',
    defaultParams: {
      beam: 3.4,
      draft: 1.7,
      freeboard: 1.1,
      bilgeRadius: 0.4,
      finDepth: 0.85,
      keelThickness: 0.3,
      demiHullWidth: 0,
    },
    visibleParams: ['beam', 'draft', 'freeboard', 'bilgeRadius', 'finDepth'],
    paramRanges: SHARED_RANGES,
  },
  {
    id: 'full-keel',
    title: 'Full keel',
    description: 'Traditional long keel with generous bilge — very stable form.',
    defaultParams: {
      beam: 3.6,
      draft: 1.5,
      freeboard: 1.0,
      bilgeRadius: 0.6,
      finDepth: 0.2,
      keelThickness: 0.45,
      demiHullWidth: 0,
    },
    visibleParams: ['beam', 'draft', 'freeboard', 'bilgeRadius', 'keelThickness'],
    paramRanges: SHARED_RANGES,
  },
  {
    id: 'catamaran',
    title: 'Catamaran',
    description: 'Twin demi-hulls — wide spacing, shallow draft per hull.',
    defaultParams: {
      beam: 7.0,
      draft: 0.55,
      freeboard: 0.95,
      bilgeRadius: 0.22,
      finDepth: 0,
      keelThickness: 0,
      demiHullWidth: 1.35,
    },
    visibleParams: ['beam', 'demiHullWidth', 'draft', 'freeboard', 'bilgeRadius'],
    paramLabels: {
      beam: 'Hull spacing (m)',
      demiHullWidth: 'Demi-hull beam (m)',
    },
    paramRanges: SHARED_RANGES,
  },
  {
    id: 'trimaran',
    title: 'Trimaran',
    description: 'Center hull plus two amas (outriggers) at each side.',
    defaultParams: {
      beam: 5.5,
      draft: 0.65,
      freeboard: 1.0,
      bilgeRadius: 0.28,
      finDepth: 0,
      keelThickness: 0,
      demiHullWidth: 1.75,
    },
    visibleParams: ['beam', 'demiHullWidth', 'draft', 'freeboard', 'bilgeRadius'],
    paramLabels: {
      beam: 'Ama spacing (m)',
      demiHullWidth: 'Center hull beam (m)',
    },
    paramRanges: SHARED_RANGES,
  },
  {
    id: 'custom',
    title: 'Custom hull',
    description: 'User-drawn cross-section — beam, draft, and freeboard come from your saved outline.',
    defaultParams: {
      beam: 3.2,
      draft: 1.0,
      freeboard: 0.65,
      bilgeRadius: 0,
      finDepth: 0,
      keelThickness: 0,
      demiHullWidth: 0,
    },
    visibleParams: [],
    paramRanges: SHARED_RANGES,
  },
]

export function isCustomHullPreset(presetId: HullPresetId): boolean {
  return presetId === 'custom'
}

export function getPreset(id: HullPresetId): HullPresetDef {
  return HULL_PRESETS.find((p) => p.id === id) ?? HULL_PRESETS[0]
}

export function isMultiHullPreset(presetId: HullPresetId): boolean {
  return presetId === 'catamaran' || presetId === 'trimaran'
}

/** Body-frame WL and deck heights measured from a reference keel z (before datum shift). */
export function bodyHeightsFromKeel(
  keelZ: number,
  p: HullParams,
): { wlZ: number; deckZ: number } {
  return {
    wlZ: keelZ + p.draft,
    deckZ: keelZ + p.draft + p.freeboard,
  }
}

export function translateOutline(outline: Vec2[], dx: number): Vec2[] {
  return outline.map((pt) => ({ x: pt.x + dx, z: pt.z }))
}

function demiHullParams(p: HullParams, beamOverride?: number): HullParams {
  const beam = beamOverride ?? (p.demiHullWidth > 0.1 ? p.demiHullWidth : p.beam * 0.35)
  return { ...p, beam: Math.max(0.6, beam) }
}

export function buildCatamaranParts(p: HullParams): Vec2[][] {
  const spacing = Math.max(p.beam, p.demiHullWidth * 2.2)
  const demi = buildRoundBilgeOutline(demiHullParams(p))
  const half = spacing / 2
  return [translateOutline(demi, -half), translateOutline(demi, half)]
}

export function buildTrimaranParts(p: HullParams): Vec2[][] {
  const spacing = Math.max(p.beam, p.demiHullWidth * 1.8)
  const center = buildRoundBilgeOutline(demiHullParams(p))
  const amaBeam = Math.max(0.55, p.demiHullWidth * 0.72)
  const ama = buildRoundBilgeOutline(demiHullParams(p, amaBeam))
  return [translateOutline(ama, -spacing), center, translateOutline(ama, spacing)]
}

type HullDeckEdges = {
  centerX: number
  deckZ: number
  minX: number
  maxX: number
}

function hullDeckEdges(part: Vec2[]): HullDeckEdges {
  const deckZ = Math.max(...part.map((p) => p.z))
  const nearDeck = part.filter((p) => p.z >= deckZ - 0.3)
  const minX = Math.min(...nearDeck.map((p) => p.x))
  const maxX = Math.max(...nearDeck.map((p) => p.x))
  const centerX = part.reduce((s, p) => s + p.x, 0) / part.length
  return { centerX, deckZ, minX, maxX }
}

export type MultiHullBridge = {
  platform: Vec2[]
  /** Lower deck beam connecting inner hull faces */
  lower: { x1: number; z1: number; x2: number; z2: number }
}

/** Deck platforms / beams linking demi-hulls (earth frame). */
export function buildMultiHullBridges(
  hullEarthParts: Vec2[][],
  presetId: HullPresetId,
  platformDepth = 0.12,
): MultiHullBridge[] {
  if (!isMultiHullPreset(presetId) || hullEarthParts.length < 2) return []

  const hulls = hullEarthParts
    .filter((p) => p.length >= 3)
    .map(hullDeckEdges)
    .sort((a, b) => a.centerX - b.centerX)

  const bridges: MultiHullBridge[] = []

  const addBridge = (left: HullDeckEdges, right: HullDeckEdges) => {
    const x1 = left.maxX
    const x2 = right.minX
    if (x2 <= x1 + 0.05) return
    const deckZ = (left.deckZ + right.deckZ) / 2
    const bottomZ = deckZ - platformDepth
    bridges.push({
      platform: [
        { x: x1, z: bottomZ },
        { x: x2, z: bottomZ },
        { x: x2, z: deckZ },
        { x: x1, z: deckZ },
      ],
      lower: { x1, z1: bottomZ, x2, z2: bottomZ },
    })
  }

  if (presetId === 'catamaran' && hulls.length >= 2) {
    addBridge(hulls[0], hulls[hulls.length - 1])
  } else if (presetId === 'trimaran' && hulls.length >= 3) {
    addBridge(hulls[0], hulls[1])
    addBridge(hulls[1], hulls[hulls.length - 1])
  }

  return bridges
}

/** Rigid bridge quad pinned at each hull deck — constant span, pitches without stretching. */
export function buildJointedBridgeQuad(
  x1: number,
  x2: number,
  leftDeckZ: number,
  rightDeckZ: number,
  platformDepth: number,
): Vec2[] {
  const topLeft: Vec2 = { x: x1, z: leftDeckZ }
  const topRight: Vec2 = { x: x2, z: rightDeckZ }
  const dx = topRight.x - topLeft.x
  const dz = topRight.z - topLeft.z
  const spanLen = Math.hypot(dx, dz)
  if (spanLen < 1e-6) {
    return [topLeft, topRight, topRight, topLeft]
  }

  let px = -dz / spanLen
  let pz = dx / spanLen
  if (pz > 0) {
    px = -px
    pz = -pz
  }

  const bottomLeft: Vec2 = {
    x: topLeft.x + px * platformDepth,
    z: topLeft.z + pz * platformDepth,
  }
  const bottomRight: Vec2 = {
    x: topRight.x + px * platformDepth,
    z: topRight.z + pz * platformDepth,
  }
  return [bottomLeft, bottomRight, topRight, topLeft]
}

/** One or more closed hull polygons in body frame (x starboard, z up from K). */
export function buildHullParts(presetId: HullPresetId, params: HullParams): Vec2[][] {
  switch (presetId) {
    case 'catamaran':
      return buildCatamaranParts(params)
    case 'trimaran':
      return buildTrimaranParts(params)
    default:
      return [buildHullOutline(presetId, params)]
  }
}

export function hullKeelZParts(parts: Vec2[][]): number {
  return Math.min(...parts.flatMap((p) => p.map((pt) => pt.z)))
}

export function applyKeelDatumParts(parts: Vec2[][]): Vec2[][] {
  const keel = hullKeelZParts(parts)
  return parts.map((p) => p.map((pt) => ({ x: pt.x, z: pt.z - keel })))
}

/** Build closed hull polygon in body frame (x starboard, z up from K at keel). */
export function buildHullOutline(presetId: HullPresetId, params: HullParams): Vec2[] {
  switch (presetId) {
    case 'classical-u':
      return buildClassicalUOutline(params)
    case 'box-barge':
      return buildBoxBargeOutline(params)
    case 'round-bilge':
      return buildRoundBilgeOutline(params)
    case 'fin-keel':
      return buildFinKeelOutline(params)
    case 'full-keel':
      return buildFullKeelOutline(params)
    case 'catamaran':
      return buildCatamaranParts(params)[0]
    case 'trimaran':
      return buildTrimaranParts(params)[1]
    case 'custom':
      return []
  }
}

/** Rectangular barge outline (symmetric, wall-sided). */
export function buildBoxBargeOutline(p: HullParams): Vec2[] {
  const half = p.beam / 2
  const deckZ = p.draft + p.freeboard
  return [
    { x: -half, z: 0 },
    { x: half, z: 0 },
    { x: half, z: deckZ },
    { x: -half, z: deckZ },
  ]
}

function arcPoints(cx: number, cz: number, r: number, a0: number, a1: number, n: number): Vec2[] {
  const pts: Vec2[] = []
  for (let i = 0; i <= n; i++) {
    const t = a0 + ((a1 - a0) * i) / n
    pts.push({ x: cx + r * Math.cos(t), z: cz + r * Math.sin(t) })
  }
  return pts
}

function mirrorPort(starboard: Vec2[]): Vec2[] {
  const port: Vec2[] = []
  for (let i = starboard.length - 2; i >= 1; i--) {
    port.push({ x: -starboard[i].x, z: starboard[i].z })
  }
  return port
}

export function buildRoundBilgeOutline(p: HullParams): Vec2[] {
  const half = p.beam / 2
  const { wlZ, deckZ } = bodyHeightsFromKeel(0, p)
  const r = Math.min(p.bilgeRadius, half * 0.45, wlZ * 0.4)

  const pts: Vec2[] = [
    { x: 0, z: 0 },
    { x: half - r, z: 0 },
    ...arcPoints(half - r, r, r, -Math.PI / 2, 0, 10),
    { x: half, z: wlZ + (deckZ - wlZ) * 0.15 },
    { x: half * 0.88, z: deckZ },
    { x: 0, z: deckZ },
  ]
  return [...pts, ...mirrorPort(pts), { x: 0, z: 0 }]
}

export function buildFinKeelOutline(p: HullParams): Vec2[] {
  const half = p.beam / 2
  const tipZ = -p.finDepth
  const { wlZ, deckZ } = bodyHeightsFromKeel(0, p)
  const r = Math.min(p.bilgeRadius, half * 0.4, p.draft * 0.35)
  const finHalf = Math.max(p.keelThickness / 2, 0.05)

  const pts: Vec2[] = [
    { x: 0, z: tipZ },
    { x: finHalf, z: tipZ + p.finDepth * 0.22 },
    { x: finHalf * 0.9, z: tipZ + p.finDepth * 0.55 },
    { x: finHalf * 0.45, z: 0 },
    { x: half * 0.12, z: r * 0.25 },
    ...arcPoints(half - r, wlZ - r, r, -Math.PI / 2, 0, 8),
    { x: half, z: wlZ + (deckZ - wlZ) * 0.15 },
    { x: half * 0.85, z: deckZ },
    { x: 0, z: deckZ },
  ]
  return [...pts, ...mirrorPort(pts), { x: 0, z: tipZ }]
}

export function buildBulbKeelOutline(p: HullParams): Vec2[] {
  const half = p.beam / 2
  const tipZ = -p.finDepth
  const { wlZ, deckZ } = bodyHeightsFromKeel(0, p)
  const r = Math.min(p.bilgeRadius, half * 0.4, p.draft * 0.35)
  const finHalf = Math.max(p.keelThickness / 2, 0.05)
  const bulbHalf = finHalf * 1.55
  const bulbBottomZ = tipZ - p.finDepth * 0.1

  const pts: Vec2[] = [
    { x: 0, z: bulbBottomZ },
    { x: bulbHalf, z: tipZ - p.finDepth * 0.06 },
    { x: bulbHalf, z: tipZ + p.finDepth * 0.08 },
    { x: finHalf, z: tipZ + p.finDepth * 0.22 },
    { x: finHalf * 0.9, z: tipZ + p.finDepth * 0.55 },
    { x: finHalf * 0.45, z: 0 },
    { x: half * 0.12, z: r * 0.25 },
    ...arcPoints(half - r, wlZ - r, r, -Math.PI / 2, 0, 8),
    { x: half, z: wlZ + (deckZ - wlZ) * 0.15 },
    { x: half * 0.85, z: deckZ },
    { x: 0, z: deckZ },
  ]
  return [...pts, ...mirrorPort(pts), { x: 0, z: bulbBottomZ }]
}

export function buildFullKeelOutline(p: HullParams): Vec2[] {
  const half = p.beam / 2
  const shoeZ = -Math.max(p.finDepth, 0.05)
  const { wlZ, deckZ } = bodyHeightsFromKeel(0, p)
  const r = Math.min(p.bilgeRadius, half * 0.45)
  const keelHalf = p.keelThickness / 2

  const pts: Vec2[] = [
    { x: 0, z: shoeZ },
    { x: keelHalf, z: shoeZ + p.finDepth * 0.35 },
    { x: keelHalf, z: wlZ * 0.22 },
    { x: half * 0.2, z: wlZ * 0.35 },
    ...arcPoints(half - r, wlZ - r, r, -Math.PI / 2, 0, 10),
    { x: half, z: wlZ + (deckZ - wlZ) * 0.2 },
    { x: half * 0.9, z: deckZ },
    { x: 0, z: deckZ },
  ]
  return [...pts, ...mirrorPort(pts), { x: 0, z: shoeZ }]
}

/** Lowest z of hull outline (keel point before datum offset). */
export function hullKeelZ(outline: Vec2[]): number {
  return Math.min(...outline.map((p) => p.z))
}

/** Max submerged area possible at θ=0 for given outline. */
export function maxSubmergedArea(outline: Vec2[]): number {
  const maxZ = Math.max(...outline.map((p) => p.z))
  const { area } = computeSubmerged(
    outline.map((p) => bodyToEarth(p, 0)),
    maxZ + 1,
  )
  return area
}

export function designReferenceArea(presetId: HullPresetId, params: HullParams): number {
  const parts = buildHullParts(presetId, params)
  const hullEarthParts = applyKeelDatumParts(parts).map((p) => bodyToEarthOutline(p, 0))
  const wlZ = params.draft - hullKeelZParts(parts)
  const { area } = computeSubmergedMulti(hullEarthParts, wlZ)
  return Math.max(0.1, area)
}

/** @deprecated Use designReferenceArea */
export function defaultSubmergedArea(presetId: HullPresetId, params: HullParams): number {
  return designReferenceArea(presetId, params)
}
