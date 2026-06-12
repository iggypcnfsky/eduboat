import type { Chemistry, ChargePhase } from './types'

/**
 * Battery chemistry model — simplified three-phase charging behaviour
 * after "Energy Unlimited" (R. Vader, Victron Energy), ch. 4:
 * bulk = full available current up to ~80% SOC, absorption = constant voltage
 * with tapering current ("why the last 20% takes hours"), float = maintain.
 */
export interface ChemistryDef {
  id: Chemistry
  label: string
  /** Do-not-discharge-below line, % SOC. */
  floorSoc: number
  /** SOC where bulk transitions into absorption. */
  absorptionStartSoc: number
  /** Usable share of nameplate capacity, for UI copy. */
  usableShare: number
  /** Max charge current the bank accepts at a given SOC, as a fraction of C. */
  acceptC: (soc: number) => number
  floorNote: string
}

export const CHEMISTRIES: Record<Chemistry, ChemistryDef> = {
  AGM: {
    id: 'AGM',
    label: 'AGM',
    floorSoc: 50,
    absorptionStartSoc: 80,
    usableShare: 0.5,
    floorNote:
      'Lead-acid banks age rapidly below 50% SOC — repeated deep discharge halves cycle life (Energy Unlimited, ch. 2).',
    acceptC: (soc) => {
      if (soc >= 100) return 0
      if (soc <= 80) return 0.25
      // Absorption taper: current falls off as the bank approaches full.
      const t = (100 - soc) / 20
      return Math.max(0.25 * Math.pow(t, 1.6), 0.008)
    },
  },
  LiFePO4: {
    id: 'LiFePO4',
    label: 'LiFePO4',
    floorSoc: 20,
    absorptionStartSoc: 97,
    usableShare: 0.8,
    floorNote:
      'LiFePO4 tolerates deep discharge far better — ~80–90% usable. Keep above ~20% SOC for longevity and BMS headroom.',
    acceptC: (soc) => {
      if (soc >= 100) return 0
      if (soc <= 97) return 0.5
      return (0.5 * (100 - soc)) / 3
    },
  },
}

export function chargePhase(chemistry: Chemistry, soc: number, charging: boolean): ChargePhase {
  if (!charging) return null
  const def = CHEMISTRIES[chemistry]
  if (soc >= 99.5) return 'float'
  if (soc >= def.absorptionStartSoc) return 'absorption'
  return 'bulk'
}
