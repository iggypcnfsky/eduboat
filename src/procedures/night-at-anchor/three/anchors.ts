import type { ElementId } from '../sim/types'

/**
 * Named 3D anchor points for every system element, in boat-local space
 * (x: +bow / -stern, y: up, z: +starboard). Units ~ meters.
 */
export const ANCHORS: Record<ElementId, [number, number, number]> = {
  battery: [0.4, -0.1, 0],
  fridge: [-1.5, 0.4, -0.55],
  plotter: [-2.4, 1.3, 0.3],
  vhf: [-0.8, 0.95, -0.6],
  usb: [-0.2, 0.45, -0.6],
  laptop: [-0.5, 0.5, -0.55],
  cabinLights: [1.3, 1.35, 0],
  cockpitLights: [-3.2, 1.05, 0.45],
  waterPump: [2.1, -0.15, 0.3],
  heater: [-3.8, 0.85, 0.5],
  anchorLight: [0.53, 16.0, 0],
  ais: [-1.2, 1.15, 0.45],
  autopilot: [-2.0, 1.25, 0.35],
  wifiRouter: [-0.6, 0.55, -0.5],
  inverter: [0.2, -0.05, 0.45],
  stereo: [0.8, 0.65, -0.45],
  fans: [1.0, 1.2, 0],
  radar: [0.4, 15.2, 0],
  bilgePump: [-0.5, -0.2, 0.35],
  alternator: [-3.0, 0.25, 0],
  solar: [-4.6, 1.7, 0],
  shore: [-5.0, 0.9, 0.4],
}
