import { designReferenceAreaForConfig } from './keel-config'
import { computeCenterOfGravity, linearLoadsFromConfig } from './weight-distribution'
import { RHO_SEAWATER, type SimConfig } from './types'

/** Submerged sectional area from weight equilibrium: ∇ = W / (ρ g) per unit length. */
export function computeEquilibriumArea(config: SimConfig): number {
  const refArea = designReferenceAreaForConfig(config)
  const { linearTotalKg, linearKeelKg } = linearLoadsFromConfig(config)
  const cg = computeCenterOfGravity(
    config.presetId,
    config.params,
    config.keelBallastId,
    refArea,
    linearTotalKg,
    linearKeelKg,
  )
  return cg.totalMassKg / RHO_SEAWATER
}
