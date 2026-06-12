import { useRef, useState } from 'react'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

const IDLE_MS = 5000
const AUTO_SPEED = 0.35

/** Orbits the boat until the user moves the camera; resumes after idle. */
export function CameraControls() {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)

  const pauseAuto = () => {
    setAutoRotate(false)
    if (idleTimer.current) clearTimeout(idleTimer.current)
  }

  const scheduleResume = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => setAutoRotate(true), IDLE_MS)
  }

  return (
    <OrbitControls
      ref={controlsRef}
      target={[0, 0.75, 0]}
      enablePan={false}
      minDistance={5.5}
      maxDistance={30}
      minPolarAngle={0.05}
      maxPolarAngle={Math.PI - 0.05}
      enableDamping
      dampingFactor={0.08}
      autoRotate={autoRotate}
      autoRotateSpeed={AUTO_SPEED}
      onStart={pauseAuto}
      onEnd={scheduleResume}
    />
  )
}
