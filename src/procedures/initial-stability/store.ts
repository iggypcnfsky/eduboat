import { create } from 'zustand'
import { computeGzCurveSymmetric } from './sim/gz-curve'
import { computeHydrostatics } from './sim/hydrostatics'
import { getPreset, HULL_PRESETS, isMultiHullPreset } from './sim/hull-presets'
import {
  applyTemplateToConfig,
  CUSTOM_TEMPLATE_ID,
  getDefaultBoatTemplate,
  getTemplate,
} from './sim/hull-templates'
import {
  DEFAULT_VESSEL_LENGTH_M,
  clampTotalBoatMassKg,
  clampVesselLengthM,
} from './sim/weight-distribution'
import type { GzCurve, HullPresetId, HydroSnapshot, KeelBallastId, SimConfig } from './sim/types'

function defaultConfig(hullTypeId: HullPresetId = 'classical-u'): SimConfig {
  const preset = getPreset(hullTypeId)
  const template = getDefaultBoatTemplate()
  const base: SimConfig = {
    presetId: hullTypeId,
    templateId: template.id,
    params: { ...preset.defaultParams },
    keelBallastId: 'fin',
    heelDeg: 0,
    vesselLengthM: DEFAULT_VESSEL_LENGTH_M,
    totalBoatMassKg: 0,
    keelBallastKg: 0,
    waveHeightM: 0.35,
    wavePeriodS: 5,
    waveNoise: 0,
    simSpeed: 1,
    dampingRatio: 0.07,
    dynamicHullStabilization: false,
    jointedDeck: false,
    hullStabilizationStrength: 0.85,
    hullStabilizationLimitM: 0.5,
  }
  return applyTemplateToConfig(base, template)
}

interface StabilityState {
  config: SimConfig
  snapshot: HydroSnapshot
  gzCurve: GzCurve
  rollSimActive: boolean
  simTimeS: number
  setHullType: (id: HullPresetId) => void
  setTemplate: (templateId: string) => void
  /** @deprecated use setHullType */
  setPreset: (id: HullPresetId) => void
  setParam: (key: keyof SimConfig['params'], value: number) => void
  setKeelBallastId: (id: KeelBallastId) => void
  setHeelDeg: (deg: number, opts?: { fromSim?: boolean }) => void
  setTotalBoatMass: (kg: number) => void
  setVesselLength: (m: number) => void
  setKeelBallastMass: (kg: number) => void
  setWaveSimParam: (
    key:
      | 'waveHeightM'
      | 'wavePeriodS'
      | 'waveNoise'
      | 'simSpeed'
      | 'dampingRatio'
      | 'dynamicHullStabilization'
      | 'jointedDeck'
      | 'hullStabilizationStrength'
      | 'hullStabilizationLimitM',
    value: number | boolean,
  ) => void
  setRollSimActive: (active: boolean) => void
  setSimTimeS: (t: number) => void
  recompute: () => void
}

function recomputeAll(config: SimConfig): { snapshot: HydroSnapshot; gzCurve: GzCurve } {
  const snapshot = computeHydrostatics(config)
  const gzCurve = computeGzCurveSymmetric(config)
  return { snapshot, gzCurve }
}

function recomputeKeepingSim(
  config: SimConfig,
  sim: Pick<StabilityState, 'rollSimActive' | 'simTimeS'>,
) {
  const { snapshot, gzCurve } = recomputeAll(config)
  return { config, snapshot, gzCurve, rollSimActive: sim.rollSimActive, simTimeS: sim.simTimeS }
}

function withWaveSimPreserved(next: SimConfig, prev: SimConfig): SimConfig {
  return {
    ...next,
    waveHeightM: prev.waveHeightM,
    wavePeriodS: prev.wavePeriodS,
    waveNoise: prev.waveNoise,
    simSpeed: prev.simSpeed,
    dampingRatio: prev.dampingRatio,
    dynamicHullStabilization: isMultiHullPreset(next.presetId)
      ? prev.dynamicHullStabilization
      : false,
    jointedDeck: isMultiHullPreset(next.presetId) ? prev.jointedDeck : false,
    hullStabilizationStrength: prev.hullStabilizationStrength,
    hullStabilizationLimitM: prev.hullStabilizationLimitM,
  }
}

const initial = defaultConfig()
const initialComputed = recomputeAll(initial)

export const useStability = create<StabilityState>((set, get) => ({
  config: initial,
  snapshot: initialComputed.snapshot,
  gzCurve: initialComputed.gzCurve,
  rollSimActive: false,
  simTimeS: 0,

  recompute: () => {
    const { config, rollSimActive, simTimeS } = get()
    set(recomputeKeepingSim(config, { rollSimActive, simTimeS }))
  },

  setRollSimActive: (active) => set({ rollSimActive: active }),

  setSimTimeS: (t) => set({ simTimeS: t }),

  setWaveSimParam: (key, value) => {
    let config = { ...get().config, [key]: value }
    if (key === 'dynamicHullStabilization' && value === true) {
      config = { ...config, jointedDeck: false }
    }
    if (key === 'jointedDeck' && value === true) {
      config = { ...config, dynamicHullStabilization: false }
    }
    set({ config })
  },

  setKeelBallastId: (keelBallastId) => {
    const prev = get().config
    const keelBallastKg =
      keelBallastId === 'none' ? 0 : Math.min(prev.keelBallastKg, prev.totalBoatMassKg)
    const config = { ...prev, templateId: CUSTOM_TEMPLATE_ID, keelBallastId, keelBallastKg }
    set(recomputeKeepingSim(config, get()))
  },

  setHullType: (hullTypeId) => {
    const prev = get().config
    const preset = getPreset(hullTypeId)
    const template =
      prev.templateId !== CUSTOM_TEMPLATE_ID ? getTemplate(prev.templateId) : undefined

    let config: SimConfig
    if (template) {
      config = applyTemplateToConfig({ ...prev, presetId: hullTypeId }, template)
    } else {
      config = {
        ...prev,
        presetId: hullTypeId,
        params: { ...preset.defaultParams, ...prev.params },
      }
    }
    config = withWaveSimPreserved(config, prev)
    set(recomputeKeepingSim(config, get()))
  },

  setTemplate: (templateId) => {
    if (templateId === CUSTOM_TEMPLATE_ID) return
    const template = getTemplate(templateId)
    if (!template) return
    const prev = get().config
    const config = withWaveSimPreserved(applyTemplateToConfig(prev, template), prev)
    set(recomputeKeepingSim(config, get()))
  },

  setPreset: (id) => get().setHullType(id),

  setParam: (key, value) => {
    const prev = get().config
    const params = { ...prev.params, [key]: value }
    const config: SimConfig = { ...prev, templateId: CUSTOM_TEMPLATE_ID, params }
    set(recomputeKeepingSim(config, get()))
  },

  setHeelDeg: (deg, opts) => {
    const config = { ...get().config, heelDeg: Math.max(-180, Math.min(180, deg)) }
    const snapshot = computeHydrostatics(config)
    set({
      config,
      snapshot,
      ...(opts?.fromSim ? {} : { rollSimActive: false, simTimeS: 0 }),
    })
  },

  setTotalBoatMass: (kg) => {
    const totalBoatMassKg = clampTotalBoatMassKg(kg)
    const keelBallastKg = Math.min(get().config.keelBallastKg, totalBoatMassKg)
    const config = { ...get().config, templateId: CUSTOM_TEMPLATE_ID, totalBoatMassKg, keelBallastKg }
    set(recomputeKeepingSim(config, get()))
  },

  setVesselLength: (m) => {
    const vesselLengthM = clampVesselLengthM(m)
    const config = { ...get().config, templateId: CUSTOM_TEMPLATE_ID, vesselLengthM }
    set(recomputeKeepingSim(config, get()))
  },

  setKeelBallastMass: (kg) => {
    const totalBoatMassKg = get().config.totalBoatMassKg
    const keelBallastKg = Math.min(Math.max(0, kg), totalBoatMassKg)
    const config = { ...get().config, templateId: CUSTOM_TEMPLATE_ID, keelBallastKg }
    set(recomputeKeepingSim(config, get()))
  },
}))

export { HULL_PRESETS, getPreset }
