import { useMemo } from 'react'
import * as THREE from 'three'
import { useSim, useSnapshot } from '../store'
import { minuteToTod } from '../sim/engine'
import { DUSK_TOD, DAWN_TOD } from '../sim/constants'

/** COLREGs sidelight / stern-light colours. */
const COLORS = {
  port: '#28e865',
  starboard: '#ff3d3d',
  stern: '#fff6e8',
  anchor: '#fff3d6',
} as const

/**
 * Positions on the scaled GLTF hull (+X bow, +Z starboard, Y up).
 * Sidelights at the bow pulpit; stern light on the transom.
 */
export const NAV_LIGHT_POSITIONS = {
  port: [4.35, 1.32, -1.22] as const,
  starboard: [4.35, 1.32, 1.22] as const,
  stern: [-4.95, 1.48, 0] as const,
  anchor: [0.53, 16.0, 0] as const,
}

function isNightMinute(minute: number): boolean {
  const tod = minuteToTod(minute)
  return tod >= DUSK_TOD || tod < DAWN_TOD
}

/** Visible nav-light fixture: dark housing + glowing coloured lens. */
function NavLightFixture({
  color,
  lensScale = 1,
  rotation = [0, 0, 0] as [number, number, number],
}: {
  color: string
  lensScale?: number
  rotation?: [number, number, number]
}) {
  const emissive = useMemo(() => new THREE.Color(color), [color])
  const s = lensScale

  return (
    <group rotation={rotation}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.14 * s, 0.1 * s, 0.1 * s]} />
        <meshStandardMaterial color="#1a2530" roughness={0.85} metalness={0.15} />
      </mesh>
      <mesh position={[0.05 * s, 0, 0]}>
        <sphereGeometry args={[0.055 * s, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={6}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.05 * s, 0, 0]}>
        <sphereGeometry args={[0.14 * s, 10, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Spotlight rotated from default −Y to the given local direction. */
function ColoredSpot({
  color,
  rotation,
  intensity = 16,
}: {
  color: string
  rotation: [number, number, number]
  intensity?: number
}) {
  return (
    <group rotation={rotation}>
      <spotLight
        color={color}
        intensity={intensity}
        distance={16}
        angle={0.58}
        penumbra={0.6}
        decay={1.4}
      />
    </group>
  )
}

function SideLight({
  position,
  color,
  spotRotation,
  fixtureRotation,
}: {
  position: readonly [number, number, number]
  color: string
  spotRotation: [number, number, number]
  fixtureRotation: [number, number, number]
}) {
  return (
    <group position={position}>
      <NavLightFixture color={color} rotation={fixtureRotation} />
      <pointLight color={color} intensity={7} distance={10} decay={1.5} />
      <ColoredSpot color={color} rotation={spotRotation} />
    </group>
  )
}

/** Port (green), starboard (red), stern (white) + masthead anchor light — night only. */
export function NavigationLights() {
  const snap = useSnapshot()
  const anchorEnabled = useSim((s) => s.config.devicesEnabled.anchorLight)
  const night = isNightMinute(snap.minute)

  // Toggle responds immediately (loads in history lag until the next sim step).
  if (!night || !anchorEnabled) return null

  return (
    <group>
      {/* Green — port / lewa burta (−Z) */}
      <SideLight
        position={NAV_LIGHT_POSITIONS.port}
        color={COLORS.port}
        spotRotation={[Math.PI / 2, 0, 0]}
        fixtureRotation={[0, Math.PI / 2, 0]}
      />
      {/* Red — starboard / prawa burta (+Z) */}
      <SideLight
        position={NAV_LIGHT_POSITIONS.starboard}
        color={COLORS.starboard}
        spotRotation={[-Math.PI / 2, 0, 0]}
        fixtureRotation={[0, -Math.PI / 2, 0]}
      />
      {/* White — stern / rufa (−X) */}
      <group position={NAV_LIGHT_POSITIONS.stern}>
        <NavLightFixture color={COLORS.stern} lensScale={1.15} rotation={[0, Math.PI, 0]} />
        <pointLight color={COLORS.stern} intensity={7.5} distance={11} decay={1.5} />
        <ColoredSpot color={COLORS.stern} rotation={[0, 0, Math.PI / 2]} intensity={14} />
      </group>
      {/* All-round white — masthead anchor light */}
      <group position={NAV_LIGHT_POSITIONS.anchor}>
        <mesh>
          <sphereGeometry args={[0.14, 14, 14]} />
          <meshStandardMaterial
            color={COLORS.anchor}
            emissive={COLORS.anchor}
            emissiveIntensity={7}
            toneMapped={false}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.32, 12, 12]} />
          <meshBasicMaterial color={COLORS.anchor} transparent opacity={0.18} depthWrite={false} toneMapped={false} />
        </mesh>
        <pointLight color={COLORS.anchor} intensity={10} distance={18} decay={1.3} />
      </group>
    </group>
  )
}
