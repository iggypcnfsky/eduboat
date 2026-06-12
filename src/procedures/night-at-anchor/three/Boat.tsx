import { forwardRef, useRef, type ForwardedRef } from 'react'
import type { Group } from 'three'
import { useFrame } from '@react-three/fiber'
import { BoatModel } from './BoatModel'
import { Hotspots } from './Hotspots'
import { EnergyStreams } from './EnergyStreams'
import { NavigationLights } from './NavigationLights'
import { useSnapshot } from '../store'
import { HULL_SAMPLES, HULL_WATERLINE_Y, waterSurfaceY } from './waves'

function assignRef(node: Group | null, ref: ForwardedRef<Group>) {
  if (typeof ref === 'function') ref(node)
  else if (ref) ref.current = node
}

export const Boat = forwardRef<Group>(function Boat(_props, ref) {
  const snap = useSnapshot()
  const groupRef = useRef<Group>(null)

  useFrame((state) => {
    const g = groupRef.current
    if (!g) return
    const t = state.clock.elapsedTime

    let sumY = 0
    for (const [x, z] of HULL_SAMPLES) sumY += waterSurfaceY(x, z, t)
    const avgY = sumY / HULL_SAMPLES.length

    const bow = waterSurfaceY(3.2, 0, t)
    const stern = waterSurfaceY(-3.2, 0, t)
    const port = waterSurfaceY(0, -1.1, t)
    const starboard = waterSurfaceY(0, 1.1, t)

    g.position.y = avgY - HULL_WATERLINE_Y
    g.rotation.x = Math.atan2(bow - stern, 6.4) * 0.9
    g.rotation.z = Math.atan2(starboard - port, 2.2) * 0.9
  })

  return (
    <group
      ref={(node) => {
        groupRef.current = node
        assignRef(node, ref)
      }}
    >
      <BoatModel />

      {snap.loads.cabinLights > 0 && (
        <pointLight position={[1.1, 1.0, 0]} color="#ffd9a0" intensity={2.2} distance={3.6} decay={2} />
      )}

      <NavigationLights />
      <EnergyStreams />
      <Hotspots />
    </group>
  )
})
