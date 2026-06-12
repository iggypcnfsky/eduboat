import * as THREE from 'three'

const NIGHT_HORIZON = new THREE.Color(0.039, 0.078, 0.122)
const NIGHT_ZENITH = new THREE.Color(0.016, 0.034, 0.058)
const DAY_HORIZON = new THREE.Color('#9ed8f5')
const DAY_ZENITH = new THREE.Color('#4a9fd4')

/** Shared horizon/zenith colours — keep water fog and sky gradient in sync. */
export function applySkyColors(daylight: number, horizon: THREE.Color, zenith: THREE.Color) {
  horizon.copy(NIGHT_HORIZON).lerp(DAY_HORIZON, daylight * 0.95)
  zenith.copy(NIGHT_ZENITH).lerp(DAY_ZENITH, daylight * 0.92)
}
