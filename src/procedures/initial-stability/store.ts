import { create } from 'zustand'
import { useCustomHullStore } from './customHullStore'
import { deriveHullParams, hasCustomKeelAppendage, sampleCustomHullOutline, clampCustomHullDraft, designWaterlineZForDraft, applyCustomHullKeelHeight, validateCustomHullDesign } from './sim/custom-hull'
import { computeGzCurveSymmetric } from './sim/gz-curve'
import { computeHydrostatics } from './sim/hydrostatics'
import { getPreset, HULL_PRESETS, isCustomHullPreset, isMultiHullPreset } from './sim/hull-presets'
import { isCustomHullKeelAllowed, resolveCustomHullKeelBallastId, resolveKeelParams } from './sim/keel-config'
import {
  applyTemplateToConfig,
  CUSTOM_TEMPLATE_ID,
  getDefaultBoatTemplate,
  getTemplate,
} from './sim/hull-templates'
import {
  DEFAULT_VESSEL_LENGTH_M,
  MIN_VESSEL_LENGTH_M,
  clampTotalBoatMassKg,
  clampVesselLengthM,
  weightSliderMaxKg,
  withDesignDisplacement,
} from './sim/weight-distribution'
import type { GzCurve, HullPresetId, HydroSnapshot, KeelBallastId, SimConfig } from './sim/types'

function defaultConfig(hullTypeId: HullPresetId = 'classical-u'): SimConfig {
  const preset = getPreset(hullTypeId)
  const template = getDefaultBoatTemplate()
  const base: SimConfig = {
    presetId: hullTypeId,
    customHullId: null,
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
    waveSwayEnabled: false,
  }
  return applyTemplateToConfig(base, template)
}

const CUSTOM_HULL_EDITABLE_PARAMS: (keyof SimConfig['params'])[] = ['finDepth', 'keelThickness']

interface StabilityState {
  config: SimConfig
  snapshot: HydroSnapshot
  gzCurve: GzCurve
  rollSimActive: boolean
  simTimeS: number
  designerOpen: boolean
  designerEditId: string | null
  setHullType: (id: HullPresetId) => void
  setCustomHull: (id: string) => void
  setTemplate: (templateId: string) => void
  /** @deprecated use setHullType */
  setPreset: (id: HullPresetId) => void
  setParam: (key: keyof SimConfig['params'], value: number) => void
  setCustomKeelHeight: (heightM: number) => void
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
      | 'hullStabilizationLimitM'
      | 'waveSwayEnabled',
    value: number | boolean,
  ) => void
  setRollSimActive: (active: boolean) => void
  setSimTimeS: (t: number) => void
  openDesigner: (existingId?: string) => void
  closeDesigner: () => void
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
    waveSwayEnabled: prev.waveSwayEnabled,
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
  designerOpen: false,
  designerEditId: null,

  openDesigner: (existingId) =>
    set({ designerOpen: true, designerEditId: existingId ?? null }),

  closeDesigner: () => set({ designerOpen: false, designerEditId: null }),

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
    if (isCustomHullPreset(prev.presetId)) {
      if (keelBallastId === 'custom-keel') {
        const design = prev.customHullId ? useCustomHullStore.getState().get(prev.customHullId) : undefined
        if (!design || !hasCustomKeelAppendage(design)) return
      } else if (!isCustomHullKeelAllowed(keelBallastId)) {
        return
      }
    }
    const params = isCustomHullPreset(prev.presetId)
      ? resolveKeelParams(prev.params, keelBallastId)
      : prev.params
    const config = {
      ...prev,
      templateId: CUSTOM_TEMPLATE_ID,
      keelBallastId,
      params,
      keelBallastKg: keelBallastId === 'none' ? 0 : prev.keelBallastKg,
    }
    set(recomputeKeepingSim(config, get()))
  },

  setCustomHull: (customHullId) => {
    const design = useCustomHullStore.getState().get(customHullId)
    if (!design) return
    const prev = get().config
    const outline = sampleCustomHullOutline(design)
    const derived = deriveHullParams(outline, design.designWaterlineZ)
    const preset = getPreset('custom')
    const keelBallastId = resolveCustomHullKeelBallastId(design, prev.keelBallastId)
    const baseParams = { ...preset.defaultParams, ...derived }
    const params = resolveKeelParams(baseParams, keelBallastId)
    const vesselLengthM =
      prev.customHullId === customHullId
        ? prev.vesselLengthM
        : clampVesselLengthM(Math.max(MIN_VESSEL_LENGTH_M, derived.beam * 1.35))
    const isSameCustomHull = prev.customHullId === customHullId
    const baseConfig = withWaveSimPreserved(
      {
        ...prev,
        presetId: 'custom',
        customHullId,
        templateId: CUSTOM_TEMPLATE_ID,
        params,
        keelBallastId,
        vesselLengthM,
      },
      prev,
    )
    // Re-save / refresh same design: keep user load so draft and weight stay independent.
    const config = isSameCustomHull
      ? baseConfig
      : withDesignDisplacement(baseConfig)
    set(recomputeKeepingSim(config, get()))
  },

  setHullType: (hullTypeId) => {
    if (isCustomHullPreset(hullTypeId)) return
    const prev = get().config
    const preset = getPreset(hullTypeId)
    const template =
      prev.templateId !== CUSTOM_TEMPLATE_ID ? getTemplate(prev.templateId) : undefined

    let config: SimConfig
    if (template) {
      config = applyTemplateToConfig({ ...prev, presetId: hullTypeId, customHullId: null }, template)
    } else {
      config = withDesignDisplacement({
        ...prev,
        presetId: hullTypeId,
        customHullId: null,
        templateId: CUSTOM_TEMPLATE_ID,
        params: { ...preset.defaultParams, ...prev.params },
      })
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

  setCustomKeelHeight: (heightM) => {
    const prev = get().config
    if (!isCustomHullPreset(prev.presetId) || !prev.customHullId) return
    const design = useCustomHullStore.getState().get(prev.customHullId)
    if (!design) return
    const updated = applyCustomHullKeelHeight(design, heightM)
    const validation = validateCustomHullDesign(updated)
    if (!validation.ok) return
    useCustomHullStore.getState().save(updated)
    const outline = sampleCustomHullOutline(updated)
    const derived = deriveHullParams(outline, updated.designWaterlineZ)
    const params = {
      ...prev.params,
      ...derived,
      finDepth: prev.params.finDepth,
      keelThickness: prev.params.keelThickness,
    }
    const config = { ...prev, templateId: CUSTOM_TEMPLATE_ID, params }
    set(recomputeKeepingSim(config, get()))
  },

  setParam: (key, value) => {
    const prev = get().config
    if (isCustomHullPreset(prev.presetId)) {
      if (key === 'draft') {
        if (!prev.customHullId) return
        const design = useCustomHullStore.getState().get(prev.customHullId)
        if (!design) return
        const outline = sampleCustomHullOutline(design)
        const draft = clampCustomHullDraft(outline, value)
        const designWaterlineZ = designWaterlineZForDraft(outline, draft)
        useCustomHullStore.getState().save({ ...design, designWaterlineZ, updatedAt: Date.now() })
        const derived = deriveHullParams(outline, designWaterlineZ)
        const params = {
          ...prev.params,
          ...derived,
          finDepth: prev.params.finDepth,
          keelThickness: prev.params.keelThickness,
        }
        const config = { ...prev, templateId: CUSTOM_TEMPLATE_ID, params }
        set(recomputeKeepingSim(config, get()))
        return
      }
      if (!CUSTOM_HULL_EDITABLE_PARAMS.includes(key)) return
    }
    const config = {
      ...prev,
      templateId: CUSTOM_TEMPLATE_ID,
      params: { ...prev.params, [key]: value },
    }
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
    const prev = get().config
    const maxKg = weightSliderMaxKg(prev)
    // Keel ballast is part of total mass — do not pull it down when total is reduced.
    const totalBoatMassKg = clampTotalBoatMassKg(Math.max(prev.keelBallastKg, kg), maxKg)
    const config = { ...prev, templateId: CUSTOM_TEMPLATE_ID, totalBoatMassKg }
    set(recomputeKeepingSim(config, get()))
  },

  setVesselLength: (m) => {
    const vesselLengthM = clampVesselLengthM(m)
    const config = {
      ...get().config,
      templateId: CUSTOM_TEMPLATE_ID,
      vesselLengthM,
    }
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
