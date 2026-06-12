import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Environment } from '@react-three/drei'
import * as THREE from 'three'
import type { Group } from 'three'
import { Boat } from './Boat'
import { Water } from './Water'
import { SkyGradient } from './SkyGradient'
import { CameraControls } from './CameraControls'
import { applySkyColors } from './skyColors'
import { useSim, useSnapshot } from '../store'
import { minuteToTod } from '../sim/engine'
import { SUNRISE_TOD, SUNSET_TOD } from '../sim/constants'

/** 0 at night, 1 at solar noon — drives lighting and sky. */
function daylightFactor(minute: number): number {
  const tod = minuteToTod(minute)
  if (tod <= SUNRISE_TOD || tod >= SUNSET_TOD) return 0
  return Math.sin((Math.PI * (tod - SUNRISE_TOD)) / (SUNSET_TOD - SUNRISE_TOD))
}

const NIGHT_SUN = new THREE.Color('#9db8d4')
const DAY_SUN = new THREE.Color('#ffe9c4')
const SUN_DIR = new THREE.Vector3(18, 28, 26).normalize()

function SkyAndLights({ daylight }: { daylight: number }) {
  const sunRef = useRef<THREE.DirectionalLight>(null)
  const ambRef = useRef<THREE.AmbientLight>(null)
  const horizon = useMemo(() => new THREE.Color(), [])
  const zenithScratch = useMemo(() => new THREE.Color(), [])

  useFrame((state) => {
    applySkyColors(daylight, horizon, zenithScratch)
    if (state.scene.fog instanceof THREE.Fog) {
      state.scene.fog.color.copy(horizon)
      state.scene.fog.near = THREE.MathUtils.lerp(55, 35, daylight)
      state.scene.fog.far = THREE.MathUtils.lerp(150, 175, daylight)
    }
    if (sunRef.current) {
      sunRef.current.intensity = 2.6 + daylight * 2.4
      sunRef.current.color.copy(NIGHT_SUN).lerp(DAY_SUN, daylight)
    }
    if (ambRef.current) {
      ambRef.current.intensity = 0.75 + daylight * 0.85
      ambRef.current.color.set('#8da5bb').lerp(new THREE.Color('#b8dff5'), daylight * 0.85)
    }
  })

  return (
    <>
      <SkyGradient daylight={daylight} />
      <ambientLight ref={ambRef} intensity={0.75} color="#8da5bb" />
      {/* key light from camera side */}
      <directionalLight ref={sunRef} position={[18, 28, 26]} intensity={2.6} color="#9db8d4" />
      {/* cool rim from port for silhouette separation */}
      <directionalLight position={[-22, 18, -20]} intensity={0.9} color="#5b7287" />
      {daylight < 0.25 && (
        <group>
          <Stars radius={160} depth={40} count={1600} factor={3.2} saturation={0} fade speed={0.4} />
          {/* the moon */}
          <mesh position={[-60, 42, -45]}>
            <sphereGeometry args={[2.6, 16, 16]} />
            <meshBasicMaterial color="#e8eef2" />
          </mesh>
        </group>
      )}
    </>
  )
}

export function Scene3D() {
  const snap = useSnapshot()
  const select = useSim((s) => s.select)
  const daylight = daylightFactor(snap.minute)
  const boatRef = useRef<Group>(null)

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true }}
      camera={{ position: [9.5, 3.4, 9.5], fov: 42, near: 0.1, far: 400 }}
      onPointerMissed={() => select(null)}
      style={{ touchAction: 'none' }}
    >
      <Suspense fallback={null}>
        <Environment preset="city" environmentIntensity={0.4 + daylight * 0.85} />
        <SkyAndLights daylight={daylight} />
        <fog attach="fog" args={['#0A141F', 55, 150]} />
        <Boat ref={boatRef} />
        <Water daylight={daylight} sunDir={SUN_DIR} boatRef={boatRef} />
        <CameraControls />
      </Suspense>
    </Canvas>
  )
}
