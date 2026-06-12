import { NAV_LIGHT_POSITIONS } from './NavigationLights'

export type BoatPointLightDef = {
  localPos: readonly [number, number, number]
  color: string
  intensity: number
  distance: number
}

/** Matches pointLight settings in NavigationLights.tsx */
export const NAV_POINT_LIGHTS: readonly BoatPointLightDef[] = [
  { localPos: NAV_LIGHT_POSITIONS.port, color: '#ff3d3d', intensity: 7, distance: 10 },
  { localPos: NAV_LIGHT_POSITIONS.starboard, color: '#28e865', intensity: 7, distance: 10 },
  { localPos: NAV_LIGHT_POSITIONS.stern, color: '#fff6e8', intensity: 7.5, distance: 11 },
  { localPos: NAV_LIGHT_POSITIONS.anchor, color: '#fff3d6', intensity: 10, distance: 18 },
]

export const CABIN_POINT_LIGHT: BoatPointLightDef = {
  localPos: [1.1, 1.0, 0],
  color: '#ffd9a0',
  intensity: 2.2,
  distance: 3.6,
}

export const MAX_BOAT_POINT_LIGHTS = 5
