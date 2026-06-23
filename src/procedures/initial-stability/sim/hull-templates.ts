import { getPreset, isMultiHullPreset } from './hull-presets'
import { clampTotalBoatMassKg, defaultKeelBallastKg, defaultTotalBoatMassKg } from './weight-distribution'
import type { HullParams, KeelBallastId, SimConfig } from './types'

export const CUSTOM_TEMPLATE_ID = 'custom'

/** Real-world boat class — applies to whichever hull type is selected. */
export interface BoatTemplate {
  id: string
  title: string
  description: string
  /** LWL or hull length used for strip-model displacement (m) */
  vesselLengthM: number
  params: HullParams
  keelBallastId?: KeelBallastId
  /** Total loaded displacement (kg) */
  totalBoatMassKg?: number
  /** Fixed ballast mass (kg); omit to use hull-type default fraction */
  keelBallastKg?: number
  isDefault?: boolean
}

function params(p: Partial<HullParams> & Pick<HullParams, 'beam' | 'draft' | 'freeboard'>): HullParams {
  return {
    bilgeRadius: 0,
    finDepth: 0,
    keelThickness: 0,
    demiHullWidth: 0,
    ...p,
  }
}

/**
 * Published dimensions (LOA/LWL, beam, draft, displacement, ballast).
 * Cross-section params are scaled to match; hull outline comes from the selected hull type.
 */
export const BOAT_TEMPLATES: BoatTemplate[] = [
  {
    id: 'classical-u-lesson',
    title: 'Classical U (lesson)',
    description: 'Textbook wide U-section from the stability lesson.',
    isDefault: true,
    vesselLengthM: 12,
    keelBallastId: 'none',
    totalBoatMassKg: 18_000,
    params: params({ beam: 7.5, draft: 1.25, freeboard: 0.65 }),
  },
  {
    id: 'antila-27',
    title: 'Antila 27',
    description: '8.24 m LWL · 2.98 m beam · 1.65 m draft · 3 200 kg (1 000 kg ballast).',
    vesselLengthM: 8.24,
    keelBallastId: 'centerboard',
    totalBoatMassKg: 3200,
    keelBallastKg: 1000,
    params: params({
      beam: 2.98,
      draft: 1.65,
      freeboard: 0.88,
      bilgeRadius: 0.28,
      finDepth: 1.05,
      keelThickness: 0.12,
    }),
  },
  {
    id: 'antila-28-2',
    title: 'Antila 28.2',
    description: '8.28 m LWL · 3.07 m beam · 1.75 m draft · 3 800 kg (1 000 kg ballast).',
    vesselLengthM: 8.28,
    keelBallastId: 'centerboard',
    totalBoatMassKg: 3800,
    keelBallastKg: 1000,
    params: params({
      beam: 3.07,
      draft: 1.75,
      freeboard: 0.9,
      bilgeRadius: 0.3,
      finDepth: 1.1,
      keelThickness: 0.12,
    }),
  },
  {
    id: 'maxus-26',
    title: 'Maxus 26',
    description: '7.68 m LOA · 2.99 m beam · 1.40 m draft · ~2 900 kg.',
    vesselLengthM: 7.2,
    keelBallastId: 'fin',
    totalBoatMassKg: 2900,
    keelBallastKg: 900,
    params: params({
      beam: 2.99,
      draft: 1.4,
      freeboard: 0.95,
      bilgeRadius: 0.26,
      finDepth: 0.75,
      keelThickness: 0.22,
    }),
  },
  {
    id: 'omega-42',
    title: 'Omega 42',
    description: '10.0 m LWL · 3.10 m beam · 1.70 m draft · 7 000 kg (3 750 kg lead).',
    vesselLengthM: 10.0,
    keelBallastId: 'fin',
    totalBoatMassKg: 7000,
    keelBallastKg: 3750,
    params: params({
      beam: 3.1,
      draft: 1.7,
      freeboard: 1.05,
      bilgeRadius: 0.32,
      finDepth: 0.95,
      keelThickness: 0.28,
    }),
  },
  {
    id: 'beneteau-first-36',
    title: 'Beneteau First 36',
    description: '10.97 m LWL · 3.99 m beam · 2.40 m draft · ~7 300 kg.',
    vesselLengthM: 10.97,
    keelBallastId: 'bulb',
    totalBoatMassKg: 7300,
    keelBallastKg: 2500,
    params: params({
      beam: 3.99,
      draft: 2.4,
      freeboard: 1.1,
      bilgeRadius: 0.34,
      finDepth: 1.25,
      keelThickness: 0.26,
    }),
  },
  {
    id: 'ilca-7',
    title: 'ILCA 7 (Laser)',
    description: '3.81 m LWL · 1.37 m beam · 0.80 m draft · 58 kg hull (~130 kg sailed).',
    vesselLengthM: 3.81,
    keelBallastId: 'centerboard',
    totalBoatMassKg: 130,
    keelBallastKg: 0,
    params: params({
      beam: 1.37,
      draft: 0.8,
      freeboard: 0.28,
      bilgeRadius: 0.08,
      finDepth: 0.55,
      keelThickness: 0.06,
    }),
  },
  {
    id: '420',
    title: 'International 420',
    description: '4.01 m LWL · 1.63 m beam · 0.97 m draft · 100 kg hull (~130 kg crewed).',
    vesselLengthM: 4.01,
    keelBallastId: 'centerboard',
    totalBoatMassKg: 130,
    keelBallastKg: 0,
    params: params({
      beam: 1.63,
      draft: 0.97,
      freeboard: 0.32,
      bilgeRadius: 0.1,
      finDepth: 0.62,
      keelThickness: 0.07,
    }),
  },
  {
    id: '470',
    title: 'International 470',
    description: '4.44 m LWL · 1.68 m beam · 0.97 m draft · 120 kg hull (~250 kg crewed).',
    vesselLengthM: 4.44,
    keelBallastId: 'centerboard',
    totalBoatMassKg: 250,
    keelBallastKg: 0,
    params: params({
      beam: 1.68,
      draft: 0.97,
      freeboard: 0.34,
      bilgeRadius: 0.1,
      finDepth: 0.62,
      keelThickness: 0.07,
    }),
  },
  {
    id: 'lagoon-42',
    title: 'Lagoon 42',
    description: '12.8 m LOA · 7.69 m beam · 1.35 m draft · ~11 500 kg cruising load.',
    vesselLengthM: 12.8,
    keelBallastId: 'internal',
    totalBoatMassKg: 11_500,
    params: params({
      beam: 7.69,
      draft: 1.35,
      freeboard: 1.2,
      bilgeRadius: 0.18,
      demiHullWidth: 1.28,
    }),
  },
  {
    id: 'coastal-cargo',
    title: 'Coastal cargo (3 000 t)',
    description: '85 m LWL · 18 m beam · 6.2 m draft · 3 000 t displacement.',
    vesselLengthM: 85,
    keelBallastId: 'none',
    totalBoatMassKg: 3_000_000,
    params: params({ beam: 18.0, draft: 6.2, freeboard: 3.4 }),
  },
  {
    id: 'handymax-bulk',
    title: 'Handymax bulk carrier',
    description: '180 m LWL · 32 m beam · 11.5 m draft · 28 000 t displacement.',
    vesselLengthM: 180,
    keelBallastId: 'none',
    totalBoatMassKg: 28_000_000,
    params: params({ beam: 32.0, draft: 11.5, freeboard: 4.8 }),
  },
]

/** @deprecated use BOAT_TEMPLATES */
export const HULL_TEMPLATES = BOAT_TEMPLATES

export function getTemplate(id: string): BoatTemplate | undefined {
  return BOAT_TEMPLATES.find((t) => t.id === id)
}

export function getAllBoatTemplates(): BoatTemplate[] {
  return BOAT_TEMPLATES
}

/** @deprecated use getAllBoatTemplates */
export function getTemplatesForHullType(_hullTypeId?: string): BoatTemplate[] {
  return BOAT_TEMPLATES
}

export function getDefaultBoatTemplate(): BoatTemplate {
  return BOAT_TEMPLATES.find((t) => t.isDefault) ?? BOAT_TEMPLATES[0]
}

/** @deprecated use getDefaultBoatTemplate */
export function getDefaultTemplate(_hullTypeId?: string): BoatTemplate {
  return getDefaultBoatTemplate()
}

function resolveKeelBallastId(
  hullTypeId: SimConfig['presetId'],
  template: BoatTemplate,
  prev: KeelBallastId,
): KeelBallastId {
  let keelBallastId = template.keelBallastId ?? prev
  if (isMultiHullPreset(hullTypeId)) {
    if (keelBallastId !== 'none' && keelBallastId !== 'internal') {
      keelBallastId = 'internal'
    }
  }
  return keelBallastId
}

/** Apply boat-class dimensions and loading; keeps the current hull type (geometry preset). */
export function applyTemplateToConfig(prev: SimConfig, template: BoatTemplate): SimConfig {
  const preset = getPreset(prev.presetId)
  const keelBallastId = resolveKeelBallastId(prev.presetId, template, prev.keelBallastId)

  const draft: SimConfig = {
    ...prev,
    presetId: prev.presetId,
    templateId: template.id,
    params: { ...preset.defaultParams, ...template.params },
    vesselLengthM: template.vesselLengthM,
    keelBallastId,
  }

  const designMass = defaultTotalBoatMassKg(draft)
  const totalBoatMassKg = clampTotalBoatMassKg(template.totalBoatMassKg ?? designMass)

  let keelBallastKg: number
  if (keelBallastId === 'none') {
    keelBallastKg = 0
  } else if (template.keelBallastKg !== undefined) {
    keelBallastKg = Math.min(template.keelBallastKg, totalBoatMassKg)
  } else {
    keelBallastKg = Math.min(defaultKeelBallastKg(draft, keelBallastId), totalBoatMassKg)
  }

  return { ...draft, totalBoatMassKg, keelBallastKg }
}

export function findMatchingTemplate(config: SimConfig): BoatTemplate | undefined {
  if (config.templateId === CUSTOM_TEMPLATE_ID) return undefined
  const t = getTemplate(config.templateId)
  return t?.id === config.templateId ? t : undefined
}
