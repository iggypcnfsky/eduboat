import { polygonAreaCentroid } from './geometry'
import type { HullParams, Vec2 } from './types'

export type NodeRegion = 'hull' | 'keel'

export type CubicBezierNode = {
  /** Starboard half anchor in meters (x >= 0). */
  anchor: Vec2
  /** Control handle offset from anchor (incoming tangent). */
  handleIn: Vec2
  /** Control handle offset from anchor (outgoing tangent). */
  handleOut: Vec2
  /** When true, dragging one handle mirrors the other through the anchor. */
  handlesLinked?: boolean
  /** Keel-labeled points form a contiguous prefix from the bottom of the chain (metadata only). */
  region?: NodeRegion
}

export type CustomHullDesign = {
  id: string
  name: string
  /** Open chain: centerline keel → starboard → centerline deck. */
  nodes: CubicBezierNode[]
  /** Design waterline height in the same body frame as nodes (m). */
  designWaterlineZ: number
  createdAt: number
  updatedAt: number
}

export const CUSTOM_HULL_SNAP_M = 0.05
export const CUSTOM_HULL_MIN_NODES = 2
const CENTERLINE_EPS = 0.02

export function createDefaultCustomHullDesign(name = 'New hull'): CustomHullDesign {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    name,
    nodes: [
      {
        anchor: { x: 0, z: -0.85 },
        handleIn: { x: 0, z: 0 },
        handleOut: { x: 0.35, z: 0.15 },
        handlesLinked: true,
      },
      {
        anchor: { x: 1.6, z: 0.35 },
        handleIn: { x: -0.45, z: -0.25 },
        handleOut: { x: 0.25, z: 0.35 },
        handlesLinked: true,
      },
      {
        anchor: { x: 0, z: 1.55 },
        handleIn: { x: 0.45, z: 0.05 },
        handleOut: { x: 0, z: 0 },
        handlesLinked: true,
      },
    ],
    designWaterlineZ: 0.45,
    createdAt: now,
    updatedAt: now,
  }
}

export function cloneCustomHullDesign(design: CustomHullDesign): CustomHullDesign {
  return {
    ...design,
    nodes: design.nodes.map((n) => ({
      anchor: { ...n.anchor },
      handleIn: { ...n.handleIn },
      handleOut: { ...n.handleOut },
      handlesLinked: n.handlesLinked ?? true,
      region: n.region ?? 'hull',
    })),
  }
}

function cubicPoint(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const u = 1 - t
  const u2 = u * u
  const u3 = u2 * u
  const t2 = t * t
  const t3 = t2 * t
  return {
    x: u3 * p0.x + 3 * u2 * t * p1.x + 3 * u * t2 * p2.x + t3 * p3.x,
    z: u3 * p0.z + 3 * u2 * t * p1.z + 3 * u * t2 * p2.z + t3 * p3.z,
  }
}

function absControlPoints(nodes: CubicBezierNode[], i: number): { p0: Vec2; p1: Vec2; p2: Vec2; p3: Vec2 } {
  const a = nodes[i].anchor
  const b = nodes[i + 1].anchor
  return {
    p0: a,
    p1: { x: a.x + nodes[i].handleOut.x, z: a.z + nodes[i].handleOut.z },
    p2: { x: b.x + nodes[i + 1].handleIn.x, z: b.z + nodes[i + 1].handleIn.z },
    p3: b,
  }
}

/** Sample the open starboard half-chain (keel centerline → deck centerline). */
export function sampleStarboardHalf(design: CustomHullDesign, samplesPerSegment = 16): Vec2[] {
  const { nodes } = design
  if (nodes.length < 2) return nodes.map((n) => ({ ...n.anchor }))

  const pts: Vec2[] = [{ ...nodes[0].anchor }]
  for (let i = 0; i < nodes.length - 1; i++) {
    const { p0, p1, p2, p3 } = absControlPoints(nodes, i)
    for (let s = 1; s <= samplesPerSegment; s++) {
      if (s === samplesPerSegment && i < nodes.length - 2) continue
      pts.push(cubicPoint(p0, p1, p2, p3, s / samplesPerSegment))
    }
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

/** Last index in the keel appendage prefix ( -1 when no keel points ). */
export function keelEndIndex(nodes: CubicBezierNode[]): number {
  let last = -1
  for (let i = 0; i < nodes.length; i++) {
    if ((nodes[i].region ?? 'hull') === 'keel') last = i
    else break
  }
  return last
}

export function hasCustomKeelAppendage(design: CustomHullDesign): boolean {
  return keelEndIndex(design.nodes) >= 1
}

/** Approximate ballast centroid from keel-labeled anchor points (body frame, from K). */
export function customKeelBallastCentroid(design: CustomHullDesign): Vec2 | null {
  const end = keelEndIndex(design.nodes)
  if (end < 1) return null
  const keelNodes = design.nodes.slice(0, end + 1)
  let sx = 0
  let sz = 0
  for (const n of keelNodes) {
    sx += n.anchor.x
    sz += n.anchor.z
  }
  return { x: sx / keelNodes.length, z: sz / keelNodes.length }
}

function closeFromStarboard(starboard: Vec2[]): Vec2[] {
  if (starboard.length < 2) return []
  const port = mirrorPort(starboard)
  return [...starboard, ...port, { ...starboard[0] }]
}

/** @deprecated Keel is a node label only — use sampleCustomHullOutline. */
export function sampleCustomKeelAppendageOutline(
  _design: CustomHullDesign,
  _samplesPerSegment = 16,
): Vec2[] | null {
  return null
}

/** Closed body-frame polygon from the full drawn hull (before keel datum shift). */
export function sampleCustomHullOutline(design: CustomHullDesign, samplesPerSegment = 16): Vec2[] {
  const starboard = sampleStarboardHalf(design, samplesPerSegment)
  if (starboard.length < 2) return starboard
  return closeFromStarboard(starboard)
}

/** @deprecated Alias for sampleCustomHullOutline — keel regions do not split geometry. */
export function sampleCustomHullBodyOutline(
  design: CustomHullDesign,
  samplesPerSegment = 16,
): Vec2[] {
  return sampleCustomHullOutline(design, samplesPerSegment)
}

export function deriveHullParams(
  outline: Vec2[],
  designWaterlineZ: number,
): Pick<HullParams, 'beam' | 'draft' | 'freeboard'> {
  if (outline.length === 0) {
    return { beam: 3, draft: 1, freeboard: 0.6 }
  }
  const { keelZ, deckZ } = customHullKeelDeckZ(outline)
  const maxX = Math.max(...outline.map((p) => Math.abs(p.x)))
  return {
    beam: Math.max(0.5, maxX * 2),
    draft: Math.max(0.1, designWaterlineZ - keelZ),
    freeboard: Math.max(0.1, deckZ - designWaterlineZ),
  }
}

export function customHullKeelDeckZ(outline: Vec2[]): { keelZ: number; deckZ: number } {
  const keelZ = Math.min(...outline.map((p) => p.z))
  const deckZ = Math.max(...outline.map((p) => p.z))
  return { keelZ, deckZ }
}

/** Draft slider bounds for a drawn outline (design WL between keel and deck). */
export function customHullDraftRange(outline: Vec2[]): { min: number; max: number } {
  const { keelZ, deckZ } = customHullKeelDeckZ(outline)
  const span = deckZ - keelZ
  return {
    min: 0.1,
    max: Math.max(0.2, span - 0.1),
  }
}

export function designWaterlineZForDraft(outline: Vec2[], draft: number): number {
  const { keelZ } = customHullKeelDeckZ(outline)
  return keelZ + draft
}

export function clampCustomHullDraft(outline: Vec2[], draft: number): number {
  const { min, max } = customHullDraftRange(outline)
  return Math.max(min, Math.min(max, draft))
}

function cloneBezierNode(n: CubicBezierNode): CubicBezierNode {
  return {
    ...n,
    anchor: { ...n.anchor },
    handleIn: { ...n.handleIn },
    handleOut: { ...n.handleOut },
    handlesLinked: n.handlesLinked ?? true,
    region: n.region ?? 'hull',
  }
}

/** Body-frame z of the hull/keel junction — first hull node after the keel prefix. */
function keelJunctionBodyZ(nodes: CubicBezierNode[], end: number): number {
  const hullStart = end + 1
  if (hullStart < nodes.length) return nodes[hullStart].anchor.z
  if (end >= 0) return nodes[end].anchor.z
  return nodes[0]?.anchor.z ?? 0
}

/** Vertical span of the keel region (bottom centerline to hull/keel junction). */
export function customHullKeelHeight(design: CustomHullDesign): number {
  const end = keelEndIndex(design.nodes)
  if (end < 0) return 0.1
  const junctionZ = keelJunctionBodyZ(design.nodes, end)
  return Math.max(0.05, junctionZ - design.nodes[0].anchor.z)
}

export function customHullKeelHeightRange(design: CustomHullDesign): { min: number; max: number } {
  const outline = sampleCustomHullOutline(design)
  const { keelZ, deckZ } = customHullKeelDeckZ(outline)
  const span = deckZ - keelZ
  return { min: 0.05, max: Math.max(0.25, span * 0.9) }
}

export function clampCustomHullKeelHeight(design: CustomHullDesign, height: number): number {
  const { min, max } = customHullKeelHeightRange(design)
  return Math.max(min, Math.min(max, height))
}

/** Rigidly translate the keel prefix; hull nodes stay fixed at the junction. */
function translateKeelPrefix(
  nodes: CubicBezierNode[],
  end: number,
  targetHeight: number,
): CubicBezierNode[] {
  if (end < 0 || nodes.length < 2) return nodes

  const junctionZ = keelJunctionBodyZ(nodes, end)
  const newBottomZ = junctionZ - targetHeight
  const deltaZ = newBottomZ - nodes[0].anchor.z
  if (Math.abs(deltaZ) < 1e-9) return nodes

  return nodes.map((n, i) => {
    if (i > end) return n
    return {
      ...n,
      anchor: { ...n.anchor, z: n.anchor.z + deltaZ },
      handleIn: { ...n.handleIn, z: n.handleIn.z + deltaZ },
      handleOut: { ...n.handleOut, z: n.handleOut.z + deltaZ },
    }
  })
}

/** Extend or shorten keel from the hull/keel junction — keel shape translates, hull stays fixed. */
export function applyCustomHullKeelHeight(design: CustomHullDesign, targetHeight: number): CustomHullDesign {
  const height = clampCustomHullKeelHeight(design, targetHeight)
  const end = keelEndIndex(design.nodes)
  let nodes = design.nodes.map(cloneBezierNode)

  if (end >= 0 && nodes.length >= 2) {
    nodes = translateKeelPrefix(nodes, end, height)
  }

  return { ...design, nodes, updatedAt: Date.now() }
}

function cross(o: Vec2, a: Vec2, b: Vec2): number {
  return (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x)
}

function segmentsIntersect(a0: Vec2, a1: Vec2, b0: Vec2, b1: Vec2): boolean {
  const d1 = cross(a0, a1, b0)
  const d2 = cross(a0, a1, b1)
  const d3 = cross(b0, b1, a0)
  const d4 = cross(b0, b1, a1)
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true
  }
  return false
}

function hasSelfIntersection(poly: Vec2[]): boolean {
  const n = poly.length
  if (n < 4) return false
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 2; j < n - 1; j++) {
      if (i === 0 && j === n - 2) continue
      if (segmentsIntersect(poly[i], poly[i + 1], poly[j], poly[j + 1])) return true
    }
  }
  return false
}

export type CustomHullValidation = { ok: true } | { ok: false; error: string }

export function validateCustomHullDesign(design: CustomHullDesign): CustomHullValidation {
  if (!design.name.trim()) {
    return { ok: false, error: 'Name is required.' }
  }
  if (design.nodes.length < CUSTOM_HULL_MIN_NODES) {
    return { ok: false, error: `At least ${CUSTOM_HULL_MIN_NODES} anchor points are required.` }
  }

  const first = design.nodes[0].anchor
  const last = design.nodes[design.nodes.length - 1].anchor
  if (Math.abs(first.x) > CENTERLINE_EPS) {
    return { ok: false, error: 'First point must sit on the centerline (keel).' }
  }
  if (Math.abs(last.x) > CENTERLINE_EPS) {
    return { ok: false, error: 'Last point must sit on the centerline (deck).' }
  }

  for (let i = 1; i < design.nodes.length - 1; i++) {
    if (design.nodes[i].anchor.x < -CENTERLINE_EPS) {
      return { ok: false, error: 'Starboard points must have x ≥ 0.' }
    }
  }

  const keelEnd = keelEndIndex(design.nodes)
  if (keelEnd >= design.nodes.length - 1) {
    return { ok: false, error: 'Leave at least one hull point above the keel region.' }
  }

  const outline = sampleCustomHullOutline(design)
  const { area } = polygonAreaCentroid(outline)
  if (area < 0.05) {
    return { ok: false, error: 'Hull outline area is too small.' }
  }
  if (hasSelfIntersection(outline)) {
    return { ok: false, error: 'Hull outline self-intersects — adjust the curve.' }
  }

  const zs = outline.map((p) => p.z)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)
  if (design.designWaterlineZ <= minZ || design.designWaterlineZ >= maxZ) {
    return { ok: false, error: 'Design waterline must lie between keel and deck.' }
  }

  return { ok: true }
}

export function snapCoord(value: number, snap: boolean, grid = CUSTOM_HULL_SNAP_M): number {
  if (!snap) return value
  return Math.round(value / grid) * grid
}

export function enforceStarboardNode(node: CubicBezierNode, index: number, total: number): CubicBezierNode {
  const anchor = { ...node.anchor }
  if (index === 0 || index === total - 1) {
    anchor.x = 0
  } else {
    anchor.x = Math.max(0, anchor.x)
  }
  return { ...node, anchor, handlesLinked: node.handlesLinked ?? true, region: node.region ?? 'hull' }
}

const HANDLE_EPS = 0.01
const DEFAULT_HANDLE_LEN = 0.22

export function nodeHasBezierHandles(node: CubicBezierNode): boolean {
  return Math.hypot(node.handleIn.x, node.handleIn.z) >= HANDLE_EPS || Math.hypot(node.handleOut.x, node.handleOut.z) >= HANDLE_EPS
}

export function isNodeHandlesLinked(node: CubicBezierNode): boolean {
  return node.handlesLinked !== false
}

export function mirrorHandle(handle: Vec2): Vec2 {
  return { x: -handle.x, z: -handle.z }
}

export function linkNodeHandles(node: CubicBezierNode): CubicBezierNode {
  const outLen = Math.hypot(node.handleOut.x, node.handleOut.z)
  const inLen = Math.hypot(node.handleIn.x, node.handleIn.z)
  if (outLen >= HANDLE_EPS) {
    return { ...node, handlesLinked: true, handleIn: mirrorHandle(node.handleOut) }
  }
  if (inLen >= HANDLE_EPS) {
    return { ...node, handlesLinked: true, handleOut: mirrorHandle(node.handleIn) }
  }
  return { ...node, handlesLinked: true }
}

export function breakNodeHandles(node: CubicBezierNode): CubicBezierNode {
  return { ...node, handlesLinked: false }
}

export function clearNodeHandles(node: CubicBezierNode): CubicBezierNode {
  return { ...node, handleIn: { x: 0, z: 0 }, handleOut: { x: 0, z: 0 } }
}

function tangentHandle(from: Vec2, to: Vec2, sign: 1 | -1, length = DEFAULT_HANDLE_LEN): Vec2 {
  const tx = to.x - from.x
  const tz = to.z - from.z
  const len = Math.hypot(tx, tz) || 1
  return { x: (sign * tx / len) * length, z: (sign * tz / len) * length }
}

/** Create default tangent handles from neighboring anchors. */
export function defaultHandlesForNode(nodes: CubicBezierNode[], index: number): Partial<CubicBezierNode> {
  const node = nodes[index]
  const patch: Partial<CubicBezierNode> = {}

  if (index > 0 && Math.hypot(node.handleIn.x, node.handleIn.z) < HANDLE_EPS) {
    patch.handleIn = tangentHandle(node.anchor, nodes[index - 1].anchor, -1)
  }
  if (index < nodes.length - 1 && Math.hypot(node.handleOut.x, node.handleOut.z) < HANDLE_EPS) {
    patch.handleOut = tangentHandle(nodes[index + 1].anchor, node.anchor, 1)
  }

  if (patch.handleIn && patch.handleOut && isNodeHandlesLinked(node)) {
    patch.handleIn = mirrorHandle(patch.handleOut)
  } else if (patch.handleOut && isNodeHandlesLinked(node) && Math.hypot(node.handleIn.x, node.handleIn.z) < HANDLE_EPS) {
    patch.handleIn = mirrorHandle(patch.handleOut)
  } else if (patch.handleIn && isNodeHandlesLinked(node) && Math.hypot(node.handleOut.x, node.handleOut.z) < HANDLE_EPS) {
    patch.handleOut = mirrorHandle(patch.handleIn)
  }

  return patch
}

export function applyLinkedHandlePatch(
  node: CubicBezierNode,
  kind: 'handleIn' | 'handleOut',
  handle: Vec2,
): Pick<CubicBezierNode, 'handleIn' | 'handleOut'> {
  if (!isNodeHandlesLinked(node)) {
    return kind === 'handleIn' ? { handleIn: handle, handleOut: node.handleOut } : { handleIn: node.handleIn, handleOut: handle }
  }
  if (kind === 'handleOut') {
    return { handleOut: handle, handleIn: mirrorHandle(handle) }
  }
  return { handleIn: handle, handleOut: mirrorHandle(handle) }
}

/** SVG path d for cubic Bézier starboard half (for designer preview). */
export function starboardBezierPathD(nodes: CubicBezierNode[]): string {
  if (nodes.length === 0) return ''
  let d = `M ${nodes[0].anchor.x.toFixed(3)} ${nodes[0].anchor.z.toFixed(3)}`
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i].anchor
    const b = nodes[i + 1].anchor
    const c1 = { x: a.x + nodes[i].handleOut.x, z: a.z + nodes[i].handleOut.z }
    const c2 = { x: b.x + nodes[i + 1].handleIn.x, z: b.z + nodes[i + 1].handleIn.z }
    d += ` C ${c1.x.toFixed(3)} ${c1.z.toFixed(3)}, ${c2.x.toFixed(3)} ${c2.z.toFixed(3)}, ${b.x.toFixed(3)} ${b.z.toFixed(3)}`
  }
  return d
}
