/** Base Y of the water mesh (world space). Displacement is added on top. */
export const WATER_BASE_Y = -0.02

/** Hull waterline in boat-local Y (model waterline is y ≈ 0). */
export const HULL_WATERLINE_Y = 0

/** Seascape wave amplitude — keep in sync with GLSL SEA_HEIGHT. */
export const SEA_HEIGHT = 0.45

const SEA_CHOPPY = 1.0
const SEA_SPEED = 1.0
const SEA_FREQ = 0.16
const ITER_GEOMETRY = 3

/** Sample points (boat-local x, z) used to average hull height and pitch/roll. */
export const HULL_SAMPLES: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [3.2, 0],
  [-3.2, 0],
  [0, -1.1],
  [0, 1.1],
]

function fract(x: number): number {
  return x - Math.floor(x)
}

function hash(px: number, py: number): number {
  const h = px * 127.1 + py * 311.7
  return fract(Math.sin(h) * 43758.5453123)
}

function noise(px: number, py: number): number {
  const ix = Math.floor(px)
  const iy = Math.floor(py)
  const fx = px - ix
  const fy = py - iy
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const a = hash(ix, iy)
  const b = hash(ix + 1, iy)
  const c = hash(ix, iy + 1)
  const d = hash(ix + 1, iy + 1)
  return -1 + 2 * (a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy)
}

function seaOctave(uvx: number, uvy: number, choppy: number): number {
  const n = noise(uvx, uvy)
  const sx = uvx + n
  const sy = uvy + n
  const wvx = 1 - Math.abs(Math.sin(sx))
  const wvy = 1 - Math.abs(Math.sin(sy))
  const swvx = Math.abs(Math.cos(sx))
  const swvy = Math.abs(Math.cos(sy))
  const mx = wvx + (swvx - wvx) * wvx
  const my = wvy + (swvy - wvy) * wvy
  return Math.pow(1 - Math.pow(mx * my, 0.65), choppy)
}

/** Must stay in sync with the GLSL in Water.tsx vertex shader. */
export function waveHeightPlane(px: number, py: number, t: number): number {
  const seaTime = t * SEA_SPEED
  let uvx = px * 0.75
  let uvy = py
  let freq = SEA_FREQ
  let amp = SEA_HEIGHT
  let choppy = SEA_CHOPPY
  let h = 0

  for (let i = 0; i < ITER_GEOMETRY; i++) {
    let d = seaOctave((uvx + seaTime) * freq, (uvy + seaTime) * freq, choppy)
    d += seaOctave((uvx - seaTime) * freq, (uvy - seaTime) * freq, choppy)
    h += d * amp
    const nx = uvx * 1.6 + uvy * 1.2
    const ny = uvx * -1.2 + uvy * 1.6
    uvx = nx
    uvy = ny
    freq *= 1.9
    amp *= 0.22
    choppy = choppy + (1 - choppy) * 0.2
  }

  return h
}

/** World X/Z → water surface Y at time t. */
export function waterSurfaceY(x: number, z: number, t: number): number {
  return WATER_BASE_Y + waveHeightPlane(x, -z, t)
}

const EPS = 0.22

/** Unit normal of the water surface in world space (matches Water shader). */
export function waterSurfaceNormal(x: number, z: number, t: number): [number, number, number] {
  const px = x
  const py = -z
  const hx = waveHeightPlane(px + EPS, py, t) - waveHeightPlane(px - EPS, py, t)
  const hy = waveHeightPlane(px, py + EPS, t) - waveHeightPlane(px, py - EPS, t)
  const nx = -hx / (2 * EPS)
  const ny = 1
  const nz = -hy / (2 * EPS)
  const len = Math.hypot(nx, ny, nz)
  return [nx / len, ny / len, nz / len]
}

/** GLSL body injected into the water vertex shader (TDM Seascape height field). */
export const WAVE_HEIGHT_GLSL = /* glsl */ `
  const float SEA_HEIGHT = ${SEA_HEIGHT.toFixed(2)};
  const float SEA_CHOPPY = ${SEA_CHOPPY.toFixed(1)};
  const float SEA_SPEED = ${SEA_SPEED.toFixed(1)};
  const float SEA_FREQ = ${SEA_FREQ.toFixed(2)};
  const mat2 octave_m = mat2(1.6, 1.2, -1.2, 1.6);

  float hash(vec2 p) {
    float h = dot(p, vec2(127.1, 311.7));
    return fract(sin(h) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return -1.0 + 2.0 * mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float sea_octave(vec2 uv, float choppy) {
    uv += noise(uv);
    vec2 wv = 1.0 - abs(sin(uv));
    vec2 swv = abs(cos(uv));
    wv = mix(wv, swv, wv);
    return pow(1.0 - pow(wv.x * wv.y, 0.65), choppy);
  }

  float waveHeight(vec2 p, float t) {
    float seaTime = t * SEA_SPEED;
    vec2 uv = p;
    uv.x *= 0.75;
    float freq = SEA_FREQ;
    float amp = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    float h = 0.0;

    for (int i = 0; i < ${ITER_GEOMETRY}; i++) {
      float d = sea_octave((uv + seaTime) * freq, choppy);
      d += sea_octave((uv - seaTime) * freq, choppy);
      h += d * amp;
      uv *= octave_m;
      freq *= 1.9;
      amp *= 0.22;
      choppy = mix(choppy, 1.0, 0.2);
    }

    return h;
  }
`
