import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WATER_BASE_Y, WAVE_HEIGHT_GLSL } from './waves'

const SEGMENTS = 256

const vertexShader = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vWave;

  ${WAVE_HEIGHT_GLSL}

  void main() {
    vec3 pos = position;
    float h = waveHeight(position.xy, uTime);
    pos.z += h;
    vWave = h;

    float eps = 0.22;
    float hx = waveHeight(position.xy + vec2(eps, 0.0), uTime) - waveHeight(position.xy - vec2(eps, 0.0), uTime);
    float hy = waveHeight(position.xy + vec2(0.0, eps), uTime) - waveHeight(position.xy - vec2(0.0, eps), uTime);
    vNormal = normalize(vec3(-hx / (2.0 * eps), 1.0, -hy / (2.0 * eps)));

    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorldPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uCrest;
  uniform vec3 uHorizon;
  uniform vec3 uMoonDir;
  uniform vec3 uMoonColor;
  uniform float uDaylight;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vWave;

  float gridLine(vec2 coord, float width) {
    vec2 g = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    float line = 1.0 - min(min(g.x, g.y), 1.0);
    return smoothstep(1.0 - width, 1.0, line);
  }

  void main() {
    vec3 n = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 lightDir = normalize(uMoonDir);

    // Smooth vertical gradient driven by wave height (crests lighter)
    float crest = clamp(vWave * 1.85 + 0.42, 0.0, 1.0);
    vec3 col = mix(uDeep, uMid, smoothstep(0.0, 0.55, crest));
    col = mix(col, uCrest, smoothstep(0.45, 1.0, crest));

    // Horizon tint at grazing angles
    float fresnel = pow(1.0 - max(dot(viewDir, n), 0.0), 2.6);
    col = mix(col, uHorizon, fresnel * (0.28 + uDaylight * 0.38));

    // Soft moon / sun highlight on swell faces
    float facing = max(dot(n, lightDir), 0.0);
    col += uMoonColor * facing * (0.06 + uDaylight * 0.1);

    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(n, halfDir), 0.0), 96.0);
    col += uMoonColor * spec * (0.35 + uDaylight * 0.45);

    // Reference grid — three scales, no procedural sparkle
    float gridFade = 1.0 - smoothstep(16.0, 95.0, length(vWorldPos.xz));
    vec3 gridCol = vec3(0.55, 0.78, 0.9) * gridFade * (0.55 + uDaylight * 0.35);
    col += gridCol * gridLine(vWorldPos.xz / 0.5, 0.06) * 0.04;
    col += gridCol * gridLine(vWorldPos.xz / 2.0, 0.12) * 0.1;
    vec2 coarse = vWorldPos.xz / 10.0;
    col += gridCol * gridLine(coarse, 0.18) * 0.15;
    vec2 fromCorner = min(fract(coarse), 1.0 - fract(coarse)) * 10.0;
    float plus = max(
      step(fromCorner.y, 0.028) * step(fromCorner.x, 0.22),
      step(fromCorner.x, 0.028) * step(fromCorner.y, 0.22)
    );
    col += gridCol * plus * step(fromCorner.x, 0.24) * step(fromCorner.y, 0.24) * 0.22;

    float dist = length(vWorldPos.xz - cameraPosition.xz);
    float fog = smoothstep(45.0, 145.0, dist);
    vec3 bg = mix(vec3(0.039, 0.078, 0.122), vec3(0.10, 0.18, 0.25), uDaylight);
    gl_FragColor = vec4(mix(col, bg, fog), 1.0);
  }
`

export function Water({ daylight }: { daylight: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color('#081e30') },
      uMid: { value: new THREE.Color('#134058') },
      uCrest: { value: new THREE.Color('#1f6a82') },
      uHorizon: { value: new THREE.Color('#2a8098') },
      uMoonDir: { value: new THREE.Vector3(-0.45, 0.65, -0.35).normalize() },
      uMoonColor: { value: new THREE.Color('#b8d4e8') },
      uDaylight: { value: 0 },
    }),
    [],
  )

  useFrame((state) => {
    if (!matRef.current) return
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime
    matRef.current.uniforms.uDaylight.value = daylight
    const deep = matRef.current.uniforms.uDeep.value as THREE.Color
    const mid = matRef.current.uniforms.uMid.value as THREE.Color
    const crest = matRef.current.uniforms.uCrest.value as THREE.Color
    const horizon = matRef.current.uniforms.uHorizon.value as THREE.Color
    deep.set('#081e30').lerp(new THREE.Color('#0f3d52'), daylight)
    mid.set('#134058').lerp(new THREE.Color('#1e6880'), daylight)
    crest.set('#1f6a82').lerp(new THREE.Color('#3a9eb8'), daylight)
    horizon.set('#2a8098').lerp(new THREE.Color('#6ec4e0'), daylight)
  })

  return (
    <mesh rotation-x={-Math.PI / 2} position-y={WATER_BASE_Y} renderOrder={-1}>
      <planeGeometry args={[280, 280, SEGMENTS, SEGMENTS]} />
      <shaderMaterial ref={matRef} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} />
    </mesh>
  )
}
