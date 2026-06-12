/** Base Y of the water mesh (world space). Displacement is added on top. */
export const WATER_BASE_Y = -0.02

/** Hull waterline in boat-local Y (model waterline is y ≈ 0). */
export const HULL_WATERLINE_Y = 0

/** Sample points (boat-local x, z) used to average hull height and pitch/roll. */
export const HULL_SAMPLES: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [3.2, 0],
  [-3.2, 0],
  [0, -1.1],
  [0, 1.1],
]

/** Must stay in sync with the GLSL in Water.tsx vertex shader. */
export function waveHeightPlane(px: number, py: number, t: number): number {
  let h = 0.48 * Math.sin(px * 0.042 + t * 0.26)
  h += 0.32 * Math.sin((px * 0.65 + py * 1.05) * 0.12 - t * 0.34)
  h += 0.22 * Math.sin(py * 0.22 + t * 0.55)
  h += 0.14 * Math.sin((px - py * 1.3) * 0.38 + t * 0.88)
  h += 0.08 * Math.sin((px * 1.6 + py * 0.9) * 0.68 + t * 1.2)
  return h
}

/** World X/Z → water surface Y at time t. */
export function waterSurfaceY(x: number, z: number, t: number): number {
  return WATER_BASE_Y + waveHeightPlane(x, -z, t)
}

const EPS = 0.22

/** Unit normal of the water surface in world space (matches Water shader). */
export function waterSurfaceNormal(x: number, z: number, t: number): [number, number, number] {
  const px = x
  const py = -z
  const hx =
    waveHeightPlane(px + EPS, py, t) - waveHeightPlane(px - EPS, py, t)
  const hy =
    waveHeightPlane(px, py + EPS, t) - waveHeightPlane(px, py - EPS, t)
  const nx = -hx / (2 * EPS)
  const ny = 1
  const nz = -hy / (2 * EPS)
  const len = Math.hypot(nx, ny, nz)
  return [nx / len, ny / len, nz / len]
}

/** GLSL body injected into the water vertex shader. */
export const WAVE_HEIGHT_GLSL = /* glsl */ `
  float waveHeight(vec2 p, float t) {
    float h = 0.48 * sin(p.x * 0.042 + t * 0.26);
    h += 0.32 * sin((p.x * 0.65 + p.y * 1.05) * 0.12 - t * 0.34);
    h += 0.22 * sin(p.y * 0.22 + t * 0.55);
    h += 0.14 * sin((p.x - p.y * 1.3) * 0.38 + t * 0.88);
    h += 0.08 * sin((p.x * 1.6 + p.y * 0.9) * 0.68 + t * 1.2);
    return h;
  }
`
