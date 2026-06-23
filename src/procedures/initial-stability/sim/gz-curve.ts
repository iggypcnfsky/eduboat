import { designReferenceAreaForConfig } from './keel-config'
import { computeHydrostatics } from './hydrostatics'
import { computeCenterOfGravity, linearLoadsFromConfig } from './weight-distribution'
import type { GzCurve, GzCurvePoint, SimConfig } from './types'

export function computeGzCurve(config: SimConfig, stepDeg = 2, maxDeg = 180): GzCurve {
  const points: GzCurvePoint[] = []
  let maxGz = -Infinity
  let maxGzAtDeg = 0
  let vanishingStabilityDeg: number | null = null
  let prevGz: number | null = null

  const upright = computeHydrostatics({ ...config, heelDeg: 0 })
  const gmUpright = upright.gmUpright

  for (let deg = 0; deg <= maxDeg; deg += stepDeg) {
    const snap = computeHydrostatics({ ...config, heelDeg: deg })
    const gz = snap.ok ? snap.gz : 0
    const gzApprox = gmUpright * Math.sin(snap.heelRad)
    points.push({ heelDeg: deg, gz, gzApprox })

    const chartOrd = chartGzOrdinate(deg, gz)
    if (chartOrd > maxGz) {
      maxGz = chartOrd
      maxGzAtDeg = deg
    }

    if (prevGz !== null && prevGz > 0 && chartOrd <= 0 && vanishingStabilityDeg === null) {
      vanishingStabilityDeg = deg
    }
    prevGz = chartOrd
  }

  return {
    points,
    maxGz: maxGz === -Infinity ? 0 : maxGz,
    maxGzAtDeg,
    vanishingStabilityDeg,
    gmUpright,
  }
}

/**
 * Stability-diagram ordinate: positive when the vessel is righting at this heel,
 * negative when the moment acts to capsize further.
 */
export function chartGzOrdinate(heelDeg: number, gz: number): number {
  if (Math.abs(gz) < 1e-9 || Math.abs(heelDeg) < 1e-9) return 0
  if (Math.abs(Math.abs(heelDeg) - 180) < 1.5 && Math.abs(gz) < 0.06) return 0
  return heelDeg * gz >= 0 ? Math.abs(gz) : -Math.abs(gz)
}

export function computeGzCurveSymmetric(
  config: SimConfig,
  stepDeg = 2,
  maxDeg = 180,
): GzCurve {
  const pos = computeGzCurve(config, stepDeg, maxDeg)
  const { linearTotalKg, linearKeelKg } = linearLoadsFromConfig(config)
  const cg = computeCenterOfGravity(
    config.presetId,
    config.params,
    config.keelBallastId,
    designReferenceAreaForConfig(config),
    linearTotalKg,
    linearKeelKg,
  )
  if (Math.abs(cg.gX) > 1e-6) return pos

  const negPoints: GzCurvePoint[] = []
  for (let deg = stepDeg; deg <= maxDeg; deg += stepDeg) {
    const snap = computeHydrostatics({ ...config, heelDeg: -deg })
    const gz = snap.ok ? snap.gz : 0
    const gzApprox = pos.gmUpright * Math.sin(snap.heelRad)
    negPoints.push({ heelDeg: -deg, gz, gzApprox })
  }
  negPoints.reverse()

  return {
    ...pos,
    points: [...negPoints, ...pos.points],
  }
}
