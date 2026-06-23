import type { Vec2 } from './types'

/** B on the initial metacentric circle — small-angle teaching model at heel θ. */
export function buoyancyOnMetacentricCircle(b0Earth: Vec2, m0Earth: Vec2, heelRad: number): Vec2 {
  const vx = b0Earth.x - m0Earth.x
  const vz = b0Earth.z - m0Earth.z
  const c = Math.cos(heelRad)
  const s = Math.sin(heelRad)
  return {
    x: m0Earth.x + vx * c - vz * s,
    z: m0Earth.z + vx * s + vz * c,
  }
}
