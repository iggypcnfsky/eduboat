import type { ComponentType } from 'react'
import { nightAtAnchorProcedure } from './night-at-anchor'

export interface ProcedureDef {
  id: string
  title: string
  oneLiner: string
  component: ComponentType
}

/**
 * Procedure registry. "Night at Anchor" (procedure F) is the first one;
 * future procedures (NMEA network builder, battery winterization, ...)
 * register here and get picked up by the app shell.
 */
export const PROCEDURES: ProcedureDef[] = [nightAtAnchorProcedure]

export const DEFAULT_PROCEDURE_ID = nightAtAnchorProcedure.id
