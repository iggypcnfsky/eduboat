import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { applySkyColors } from './skyColors'

const vertexShader = /* glsl */ `
  varying vec3 vDir;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vDir = normalize(world.xyz - cameraPosition);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uHorizon;
  uniform vec3 uZenith;
  varying vec3 vDir;

  void main() {
    float elev = clamp(vDir.y, 0.0, 1.0);
    float t = pow(elev, 0.62);
    gl_FragColor = vec4(mix(uHorizon, uZenith, t), 1.0);
  }
`

export function SkyGradient({ daylight }: { daylight: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  const uniforms = useMemo(
    () => ({
      uHorizon: { value: new THREE.Color('#0A141F') },
      uZenith: { value: new THREE.Color('#060d14') },
    }),
    [],
  )

  useFrame(({ camera, scene }) => {
    if (meshRef.current) meshRef.current.position.copy(camera.position)
    applySkyColors(daylight, uniforms.uHorizon.value, uniforms.uZenith.value)

    if (!(scene.background instanceof THREE.Color)) scene.background = new THREE.Color()
    ;(scene.background as THREE.Color).copy(uniforms.uHorizon.value)
  })

  return (
    <mesh ref={meshRef} frustumCulled={false} renderOrder={-1000}>
      <sphereGeometry args={[360, 48, 24]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  )
}
