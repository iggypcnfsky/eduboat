import type { Vec2 } from './types'

const DEG = Math.PI / 180

/** Rotate body point to earth frame: heel θ starboard (clockwise in x-z view). */
export function bodyToEarth(p: Vec2, heelRad: number): Vec2 {
  const c = Math.cos(heelRad)
  const s = Math.sin(heelRad)
  return {
    x: p.x * c + p.z * s,
    z: -p.x * s + p.z * c,
  }
}

export function bodyToEarthOutline(outline: Vec2[], heelRad: number): Vec2[] {
  return outline.map((p) => bodyToEarth(p, heelRad))
}

export function earthToBody(p: Vec2, heelRad: number): Vec2 {
  const c = Math.cos(heelRad)
  const s = Math.sin(heelRad)
  return {
    x: p.x * c - p.z * s,
    z: p.x * s + p.z * c,
  }
}

export function polygonAreaCentroid(poly: Vec2[]): { area: number; cx: number; cz: number } {
  const n = poly.length
  if (n < 3) return { area: 0, cx: 0, cz: 0 }

  let a = 0
  let cx = 0
  let cz = 0
  for (let i = 0; i < n; i++) {
    const p0 = poly[i]
    const p1 = poly[(i + 1) % n]
    const cross = p0.x * p1.z - p1.x * p0.z
    a += cross
    cx += (p0.x + p1.x) * cross
    cz += (p0.z + p1.z) * cross
  }
  a *= 0.5
  if (Math.abs(a) < 1e-12) return { area: 0, cx: 0, cz: 0 }
  cx /= 6 * a
  cz /= 6 * a
  return { area: Math.abs(a), cx, cz }
}

/** Clip polygon to region z <= waterlineZ (Sutherland-Hodgman against horizontal line). */
export function clipBelowWaterline(poly: Vec2[], waterlineZ: number): Vec2[] {
  if (poly.length === 0) return []

  const inside = (p: Vec2) => p.z <= waterlineZ + 1e-9
  const intersect = (a: Vec2, b: Vec2): Vec2 => {
    const t = (waterlineZ - a.z) / (b.z - a.z)
    return { x: a.x + t * (b.x - a.x), z: waterlineZ }
  }

  let output = poly
  // Single half-plane: keep below waterline
  const input = output
  output = []
  if (input.length === 0) return output

  let s = input[input.length - 1]
  for (const e of input) {
    if (inside(e)) {
      if (!inside(s)) output.push(intersect(s, e))
      output.push(e)
    } else if (inside(s)) {
      output.push(intersect(s, e))
    }
    s = e
  }
  return output
}

/** Find horizontal waterline segments where hull edges cross waterlineZ. */
export function waterlineSegments(hull: Vec2[], waterlineZ: number): [number, number][] {
  const xs: number[] = []
  const n = hull.length
  for (let i = 0; i < n; i++) {
    const a = hull[i]
    const b = hull[(i + 1) % n]
    if ((a.z <= waterlineZ && b.z > waterlineZ) || (a.z > waterlineZ && b.z <= waterlineZ)) {
      const t = (waterlineZ - a.z) / (b.z - a.z)
      xs.push(a.x + t * (b.x - a.x))
    } else if (Math.abs(a.z - waterlineZ) < 1e-8) {
      xs.push(a.x)
    }
  }
  if (xs.length < 2) return xs.length === 1 ? [[xs[0], xs[0]]] : []
  xs.sort((a, b) => a - b)
  const segs: [number, number][] = []
  for (let i = 0; i + 1 < xs.length; i += 2) {
    segs.push([xs[i], xs[i + 1]])
  }
  if (xs.length % 2 === 1 && xs.length > 1) {
    segs.push([xs[xs.length - 2], xs[xs.length - 1]])
  }
  return segs
}

/** Second moment of waterplane about x=0 (earth vertical axis through centerline projection). */
export function waterplaneInertia(segments: [number, number][]): number {
  let i = 0
  for (const [x1, x2] of segments) {
    const a = Math.min(x1, x2)
    const b = Math.max(x1, x2)
    i += (b ** 3 - a ** 3) / 3
  }
  return i
}

export function waterplaneWidth(segments: [number, number][]): number {
  return segments.reduce((sum, [a, b]) => sum + Math.abs(b - a), 0)
}

export interface SubmergedResult {
  area: number
  centroid: Vec2
  submerged: Vec2[]
  segments: [number, number][]
  inertia: number
}

export function computeSubmerged(hullEarth: Vec2[], waterlineZ: number): SubmergedResult {
  const submerged = clipBelowWaterline(hullEarth, waterlineZ)
  const { area, cx, cz } = polygonAreaCentroid(submerged)
  const segments = waterlineSegments(hullEarth, waterlineZ)
  const inertia = waterplaneInertia(segments)
  return {
    area,
    centroid: { x: cx, z: cz },
    submerged,
    segments,
    inertia,
  }
}

/** Submerged properties summed across multiple hull cross-sections. */
export function computeSubmergedMulti(hullsEarth: Vec2[][], waterlineZ: number): SubmergedResult {
  if (hullsEarth.length === 0) {
    return { area: 0, centroid: { x: 0, z: 0 }, submerged: [], segments: [], inertia: 0 }
  }
  if (hullsEarth.length === 1) return computeSubmerged(hullsEarth[0], waterlineZ)

  let totalArea = 0
  let cxSum = 0
  let czSum = 0
  const submerged: Vec2[] = []
  const segments: [number, number][] = []
  let inertia = 0

  for (const hull of hullsEarth) {
    if (hull.length < 3) continue
    const r = computeSubmerged(hull, waterlineZ)
    totalArea += r.area
    cxSum += r.centroid.x * r.area
    czSum += r.centroid.z * r.area
    submerged.push(...r.submerged)
    segments.push(...r.segments)
    inertia += r.inertia
  }

  return {
    area: totalArea,
    centroid:
      totalArea > 1e-9
        ? { x: cxSum / totalArea, z: czSum / totalArea }
        : { x: 0, z: 0 },
    submerged,
    segments,
    inertia,
  }
}

/** Binary search waterline for target submerged area. */
export function findWaterlineForArea(
  hullEarth: Vec2[],
  targetArea: number,
  zMin: number,
  zMax: number,
): { waterlineZ: number; result: SubmergedResult } | null {
  return findWaterlineForAreaMulti([hullEarth], targetArea, zMin, zMax)
}

/** Binary search waterline for target submerged area across one or more hulls. */
export function findWaterlineForAreaMulti(
  hullsEarth: Vec2[][],
  targetArea: number,
  zMin: number,
  zMax: number,
): { waterlineZ: number; result: SubmergedResult } | null {
  let lo = zMin
  let hi = zMax
  let best: { waterlineZ: number; result: SubmergedResult } | null = null

  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2
    const result = computeSubmergedMulti(hullsEarth, mid)
    if (result.area >= targetArea) {
      best = { waterlineZ: mid, result }
      hi = mid
    } else {
      lo = mid
    }
  }

  if (!best || best.result.area < targetArea * 0.995) return null
  return best
}

export function heelRadFromDeg(deg: number): number {
  return deg * DEG
}

export function heelDegFromRad(rad: number): number {
  return rad / DEG
}

/** Centerline direction in earth frame (body +z rotated). */
export function centerlineDirection(heelRad: number): Vec2 {
  return bodyToEarth({ x: 0, z: 1 }, heelRad)
}

/** Point on body centerline at body-z. */
export function centerlinePoint(bodyZ: number, heelRad: number): Vec2 {
  return bodyToEarth({ x: 0, z: bodyZ }, heelRad)
}

export { DEG }
