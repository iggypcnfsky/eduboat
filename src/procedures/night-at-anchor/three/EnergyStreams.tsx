import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import type { Line2 } from 'three-stdlib'
import type { LineMaterial } from 'three-stdlib'
import * as THREE from 'three'
import { ANCHORS } from './anchors'
import { useSnapshot } from '../store'
import { DEVICES } from '../sim/devices'
import type { ElementId } from '../sim/types'

const COLOR_OUT = '#F0A35E'
const COLOR_IN = '#5FD4C4'

/** Mast base waypoint — flows to the masthead climb the mast instead of cutting through air. */
const MAST_BASE = new THREE.Vector3(0.53, 1.45, 0)

function buildCurve(fromId: ElementId, toId: ElementId): THREE.Vector3[] {
  const a = new THREE.Vector3(...ANCHORS[fromId])
  const b = new THREE.Vector3(...ANCHORS[toId])

  if (toId === 'anchorLight') {
    const curve = new THREE.CatmullRomCurve3([a, MAST_BASE, b], false, 'catmullrom', 0.1)
    return curve.getPoints(56)
  }

  const mid = a.clone().lerp(b, 0.5)
  mid.y += Math.min(0.35 + a.distanceTo(b) * 0.1, 1.0)
  mid.z += 0.3 // bow toward the open (cutaway) side
  return new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(40)
}

function FlowLine({
  fromId,
  toId,
  color,
  intensity,
}: {
  fromId: ElementId
  toId: ElementId
  color: string
  intensity: number
}) {
  const dashRef = useRef<Line2>(null)
  const points = useMemo(() => buildCurve(fromId, toId), [fromId, toId])

  useFrame((_, delta) => {
    const line = dashRef.current
    if (!line) return
    const mat = line.material as LineMaterial
    mat.dashOffset -= delta * (0.6 + intensity * 1.8)
  })

  return (
    <group>
      {/* faint conduit */}
      <Line points={points} color={color} transparent opacity={0.16} lineWidth={1} />
      {/* flowing pulse */}
      <Line
        ref={dashRef}
        points={points}
        color={color}
        lineWidth={1.6 + intensity * 1.6}
        dashed
        dashSize={0.22}
        gapSize={0.3}
        transparent
        opacity={0.95}
      />
    </group>
  )
}

/**
 * Animated energy flows: amber pulses from the bank to every device
 * currently drawing, cyan pulses from active sources into the bank.
 */
export function EnergyStreams() {
  const snap = useSnapshot()

  const flows: Array<{ from: ElementId; to: ElementId; color: string; intensity: number }> = []

  for (const dev of DEVICES) {
    const a = snap.loads[dev.id]
    if (a > 0.05) {
      flows.push({ from: 'battery', to: dev.id, color: COLOR_OUT, intensity: Math.min(a / 4, 1) })
    }
  }
  if (snap.solarA > 0.1) {
    flows.push({ from: 'solar', to: 'battery', color: COLOR_IN, intensity: Math.min(snap.solarA / 12, 1) })
  }
  if (snap.altA > 0.1) {
    flows.push({ from: 'alternator', to: 'battery', color: COLOR_IN, intensity: Math.min(snap.altA / 70, 1) })
  }

  return (
    <group>
      {flows.map((f) => (
        <FlowLine key={`${f.from}-${f.to}`} fromId={f.from} toId={f.to} color={f.color} intensity={f.intensity} />
      ))}
    </group>
  )
}
