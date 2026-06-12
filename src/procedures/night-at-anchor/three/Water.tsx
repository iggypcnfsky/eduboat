import { useMemo, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CABIN_POINT_LIGHT, MAX_BOAT_POINT_LIGHTS, NAV_POINT_LIGHTS } from './boatLights'
import { isNightMinute } from './NavigationLights'
import { applySkyColors } from './skyColors'
import { useSim, useSnapshot } from '../store'
import { SEA_HEIGHT, WATER_BASE_Y, WAVE_HEIGHT_GLSL } from './waves'

const LIGHT_POS = Array.from({ length: MAX_BOAT_POINT_LIGHTS }, () => new THREE.Vector3())
const LIGHT_COL = Array.from({ length: MAX_BOAT_POINT_LIGHTS }, () => new THREE.Color())
const LIGHT_INT = new Float32Array(MAX_BOAT_POINT_LIGHTS)
const LIGHT_DIST = new Float32Array(MAX_BOAT_POINT_LIGHTS)
const TMP_POS = new THREE.Vector3()

const SEGMENTS = 256
const WATER_SIZE = 320
const WATER_HALF = WATER_SIZE * 0.5

const SUN_DIR = new THREE.Vector3(18, 28, 26).normalize()
const MOON_DIR = new THREE.Vector3(-60, 42, -45).normalize()

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
  uniform vec3 uSeaBase;
  uniform vec3 uSeaWaterColor;
  uniform vec3 uSunDir;
  uniform vec3 uMoonDir;
  uniform vec3 uSunColor;
  uniform float uDaylight;
  uniform float uSeaHeight;
  uniform float uHasEnvMap;
  uniform vec3 uFogColor;
  uniform vec3 uSkyHorizon;
  uniform vec3 uSkyZenith;
  uniform int uPointLightCount;
  uniform vec3 uPointLightPos[${MAX_BOAT_POINT_LIGHTS}];
  uniform vec3 uPointLightCol[${MAX_BOAT_POINT_LIGHTS}];
  uniform float uPointLightInt[${MAX_BOAT_POINT_LIGHTS}];
  uniform float uPointLightDist[${MAX_BOAT_POINT_LIGHTS}];
  uniform samplerCube uEnvMap;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vWave;

  float gridLine(vec2 coord, float width) {
    vec2 g = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    float line = 1.0 - min(min(g.x, g.y), 1.0);
    return smoothstep(1.0 - width, 1.0, line);
  }

  float diffuse(vec3 n, vec3 l, float p) {
    return pow(dot(n, l) * 0.4 + 0.6, p);
  }

  float softSpecular(vec3 n, vec3 l, vec3 e, float tightness, float strength) {
    vec3 h = normalize(l + e);
    float ndotl = max(dot(n, l), 0.0);
    float ndoth = max(dot(n, h), 0.0);
    float wide = pow(ndoth, max(tightness * 0.18, 4.0)) * ndotl;
    float tight = pow(ndoth, tightness) * ndotl * 0.22;
    return min((wide * 0.75 + tight) * strength, 0.38);
  }

  vec3 getSkyColor(vec3 e) {
    e.y = max(e.y, 0.0);
    float t = pow(e.y, 0.62);
    return mix(uSkyHorizon, uSkyZenith, t);
  }

  vec3 sampleReflection(vec3 eye, vec3 n) {
    vec3 reflected = reflect(eye, n);
    reflected.x = -reflected.x;
    if (uHasEnvMap > 0.5) {
      return textureCube(uEnvMap, reflected).rgb;
    }
    return getSkyColor(reflected);
  }

  vec3 boatPointLights(vec3 n, vec3 eye, vec3 worldPos) {
    vec3 sum = vec3(0.0);
    for (int i = 0; i < ${MAX_BOAT_POINT_LIGHTS}; i++) {
      if (i >= uPointLightCount) break;
      vec3 toLight = uPointLightPos[i] - worldPos;
      float dist = length(toLight);
      if (dist < 0.001 || dist > uPointLightDist[i]) continue;
      vec3 l = toLight / dist;
      float falloff = 1.0 / (1.0 + dist * dist * 0.045);
      falloff *= 1.0 - smoothstep(uPointLightDist[i] * 0.72, uPointLightDist[i], dist);
      float ndotl = max(dot(n, l), 0.0);
      vec3 h = normalize(l - eye);
      float spec = pow(max(dot(n, h), 0.0), 18.0) * 0.35;
      sum += uPointLightCol[i] * (ndotl * 0.9 + spec) * uPointLightInt[i] * falloff;
    }
    return sum;
  }

  void main() {
    vec3 n = normalize(vNormal);
    // Soften facet normals at night to avoid harsh triangular sparkles
    n = normalize(mix(n, vec3(0.0, 1.0, 0.0), (1.0 - uDaylight) * 0.32));
    vec3 eye = normalize(vWorldPos - cameraPosition);
    vec3 sunDir = normalize(uSunDir);
    vec3 moonDir = normalize(uMoonDir);
    vec3 nightLight = normalize(mix(moonDir, sunDir, uDaylight));

    float fresnel = 1.0 - max(dot(n, -eye), 0.0);
    fresnel = pow(fresnel, mix(4.0, 2.8, uDaylight)) * mix(0.28, 0.88, uDaylight);

    vec3 reflectN = normalize(mix(n, vec3(0.0, 1.0, 0.0), (1.0 - uDaylight) * 0.18));
    vec3 reflected = sampleReflection(eye, reflectN);
    vec3 refracted = uSeaBase + diffuse(n, nightLight, 80.0) * uSeaWaterColor * mix(0.10, 0.38, uDaylight);
    vec3 col = mix(refracted, reflected, fresnel);
    col *= mix(0.68, 1.0, uDaylight);
    col += vec3(0.04, 0.10, 0.14) * uDaylight;

    float dist = length(vWorldPos.xz - cameraPosition.xz);
    float atten = max(1.0 - dist * dist * 0.00008, 0.0);
    float crest = clamp(vWave * 2.2 + 0.35, 0.0, 1.0);
    col = mix(col, col + uSeaWaterColor * 0.25, crest * mix(0.18, 0.35, uDaylight));
    col += uSeaWaterColor * (vWave - uSeaHeight * 0.35) * mix(0.12, 0.22, uDaylight) * atten;

    float night = 1.0 - uDaylight;
    vec3 moonColor = mix(vec3(0.72, 0.82, 0.92), uSunColor, uDaylight);
    col += moonColor * softSpecular(n, moonDir, eye, mix(14.0, 36.0, uDaylight), mix(0.55, 0.28, uDaylight));
    col += uSunColor * softSpecular(n, sunDir, eye, mix(18.0, 42.0, uDaylight), mix(0.12, 0.35, uDaylight)) * uDaylight;
    col += boatPointLights(n, eye, vWorldPos) * mix(0.14, 0.05, uDaylight);

    // Reference grid — three scales, no procedural sparkle
    float gridFade = 1.0 - smoothstep(16.0, 95.0, length(vWorldPos.xz));
    vec3 gridCol = vec3(0.55, 0.78, 0.9) * gridFade * (0.55 + uDaylight * 0.35);
    col += gridCol * gridLine(vWorldPos.xz / 0.5, 0.09) * 0.04;
    col += gridCol * gridLine(vWorldPos.xz / 2.0, 0.18) * 0.1;
    vec2 coarse = vWorldPos.xz / 10.0;
    col += gridCol * gridLine(coarse, 0.27) * 0.15;
    vec2 fromCorner = min(fract(coarse), 1.0 - fract(coarse)) * 10.0;
    float plus = max(
      step(fromCorner.y, 0.028) * step(fromCorner.x, 0.22),
      step(fromCorner.x, 0.028) * step(fromCorner.y, 0.22)
    );
    col += gridCol * plus * step(fromCorner.x, 0.24) * step(fromCorner.y, 0.24) * 0.22;

    // Atmospheric fog — restore classic night falloff, add visible day haze
    float viewDist = length(vWorldPos - cameraPosition);
    float nightFog = smoothstep(45.0, 145.0, dist);
    nightFog = nightFog * nightFog * (3.0 - 2.0 * nightFog);

    float dayFog = smoothstep(28.0, 118.0, dist);
    dayFog = dayFog * dayFog * (3.0 - 2.0 * dayFog);
    dayFog = max(dayFog, smoothstep(38.0, 138.0, viewDist) * 0.55);

    // Dissolve mesh edges before the plane boundary
    float edgeX = ${WATER_HALF.toFixed(1)} - abs(vWorldPos.x);
    float edgeZ = ${WATER_HALF.toFixed(1)} - abs(vWorldPos.z);
    float edgeDist = min(edgeX, edgeZ);
    float edgeFog = 1.0 - smoothstep(0.0, 72.0, edgeDist);
    edgeFog = edgeFog * edgeFog;

    float fog = mix(nightFog, dayFog, uDaylight);
    fog = max(fog, edgeFog * mix(1.0, 0.7, uDaylight));
    gl_FragColor = vec4(mix(col, uFogColor, fog), 1.0);
  }
`

type WaterProps = {
  daylight: number
  sunDir?: THREE.Vector3
  boatRef?: RefObject<THREE.Group | null>
}

export function Water({ daylight, sunDir = SUN_DIR, boatRef }: WaterProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const { scene } = useThree()
  const snap = useSnapshot()
  const anchorEnabled = useSim((s) => s.config.devicesEnabled.anchorLight)
  const skyHorizon = useMemo(() => new THREE.Color(), [])
  const skyZenith = useMemo(() => new THREE.Color(), [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeaBase: { value: new THREE.Color('#081e30') },
      uSeaWaterColor: { value: new THREE.Color('#1a5060') },
      uSunDir: { value: sunDir.clone() },
      uMoonDir: { value: MOON_DIR.clone() },
      uSunColor: { value: new THREE.Color('#b8d4e8') },
      uDaylight: { value: 0 },
      uSeaHeight: { value: SEA_HEIGHT },
      uFogColor: { value: new THREE.Color('#0A141F') },
      uSkyHorizon: { value: new THREE.Color('#0A141F') },
      uSkyZenith: { value: new THREE.Color('#060d14') },
      uPointLightCount: { value: 0 },
      uPointLightPos: { value: LIGHT_POS.map((v) => v.clone()) },
      uPointLightCol: { value: LIGHT_COL.map((c) => c.clone()) },
      uPointLightInt: { value: LIGHT_INT.slice() },
      uPointLightDist: { value: LIGHT_DIST.slice() },
      uEnvMap: { value: null as THREE.CubeTexture | null },
      uHasEnvMap: { value: 0 },
    }),
    [sunDir],
  )

  useFrame((state) => {
    if (!matRef.current) return
    const mat = matRef.current
    mat.uniforms.uTime.value = state.clock.elapsedTime
    mat.uniforms.uDaylight.value = daylight
    mat.uniforms.uSunDir.value.copy(sunDir)

    const seaBase = mat.uniforms.uSeaBase.value as THREE.Color
    const seaWater = mat.uniforms.uSeaWaterColor.value as THREE.Color
    const sunColor = mat.uniforms.uSunColor.value as THREE.Color
    seaBase.setRGB(0.025, 0.06, 0.09).lerp(new THREE.Color('#2a7a98'), daylight)
    seaWater.setRGB(0.06, 0.14, 0.18).lerp(new THREE.Color('#6ec8ea'), daylight)
    sunColor.set('#b8d4e8').lerp(new THREE.Color('#ffe9c4'), daylight)

    const fogColor = mat.uniforms.uFogColor.value as THREE.Color
    applySkyColors(daylight, skyHorizon, skyZenith)
    fogColor.copy(skyHorizon)
    ;(mat.uniforms.uSkyHorizon.value as THREE.Color).copy(skyHorizon)
    ;(mat.uniforms.uSkyZenith.value as THREE.Color).copy(skyZenith)

    let lightCount = 0
    const boat = boatRef?.current
    const posUniforms = mat.uniforms.uPointLightPos.value as THREE.Vector3[]
    const colUniforms = mat.uniforms.uPointLightCol.value as THREE.Color[]
    const intUniforms = mat.uniforms.uPointLightInt.value as Float32Array
    const distUniforms = mat.uniforms.uPointLightDist.value as Float32Array

    const pushLight = (def: (typeof NAV_POINT_LIGHTS)[number]) => {
      if (lightCount >= MAX_BOAT_POINT_LIGHTS || !boat) return
      TMP_POS.set(def.localPos[0], def.localPos[1], def.localPos[2]).applyMatrix4(boat.matrixWorld)
      posUniforms[lightCount].copy(TMP_POS)
      colUniforms[lightCount].set(def.color)
      intUniforms[lightCount] = def.intensity
      distUniforms[lightCount] = def.distance
      lightCount++
    }

    if (boat && isNightMinute(snap.minute) && anchorEnabled) {
      for (const def of NAV_POINT_LIGHTS) pushLight(def)
    }
    if (boat && snap.loads.cabinLights > 0) pushLight(CABIN_POINT_LIGHT)
    mat.uniforms.uPointLightCount.value = lightCount

    const env = scene.environment
    if (env) {
      mat.uniforms.uEnvMap.value = env
      mat.uniforms.uHasEnvMap.value = 1
    } else {
      mat.uniforms.uHasEnvMap.value = 0
    }
  })

  return (
    <mesh rotation-x={-Math.PI / 2} position-y={WATER_BASE_Y} renderOrder={-1}>
      <planeGeometry args={[WATER_SIZE, WATER_SIZE, SEGMENTS, SEGMENTS]} />
      <shaderMaterial ref={matRef} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} />
    </mesh>
  )
}
