import type { ComponentType } from 'react'
import { nightAtAnchorProcedure } from './night-at-anchor'
import { initialStabilityProcedure } from './initial-stability'

export interface CategoryDef {
  id: string
  title: string
  description: string
}

export interface ProcedureDef {
  id: string
  categoryId: string
  title: string
  oneLiner: string
  component: ComponentType
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: 'electric-systems',
    title: 'Electric Systems',
    description:
      'Onboard energy, batteries, charging, and electrical loads — see where your power goes.',
  },
  {
    id: 'yacht-design',
    title: 'Yacht Design',
    description:
      'Hull form, stability, and naval architecture — interactive tools for understanding how boats behave.',
  },
]

export const PROCEDURES: ProcedureDef[] = [nightAtAnchorProcedure, initialStabilityProcedure]

export const DEFAULT_PROCEDURE_ID = nightAtAnchorProcedure.id

export function getCategory(id: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.id === id)
}

export function getProceduresForCategory(categoryId: string): ProcedureDef[] {
  return PROCEDURES.filter((p) => p.categoryId === categoryId)
}

export function getProcedure(id: string): ProcedureDef | undefined {
  return PROCEDURES.find((p) => p.id === id)
}
