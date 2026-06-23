import type { HullParams } from '../sim/types'

export const PARAM_HELP: Partial<
  Record<keyof HullParams, { title: string; text: string }>
> = {
  beam: {
    title: 'Beam',
    text: 'Maximum breadth of the hull cross-section. Wider waterplanes increase submerged area and metacentric radius BM.',
  },
  draft: {
    title: 'Draft',
    text: 'Hull depth from keel (K) to the reference waterline on the drawing. Does not change total weight — the solver adjusts immersion until buoyancy matches your weight slider.',
  },
  freeboard: {
    title: 'Freeboard',
    text: 'Height from the design waterline to the deck edge — the dry topsides above the sea. Does not add underwater volume, but superstructure mass raises KG.',
  },
  bilgeRadius: {
    title: 'Bilge radius',
    text: 'Radius of the curved transition between bottom and sides. Softens the section shape and changes how volume enters the water as the vessel heels.',
  },
  finDepth: {
    title: 'Fin depth',
    text: 'Extra appendage length below the hull bottom (does not reduce draft). The hull body and waterline stay fixed; the section grows deeper at the keel.',
  },
  keelThickness: {
    title: 'Keel thickness',
    text: 'Width of the long external keel shoe. Adds low structure below the hull without changing the draft reference on the main body.',
  },
  demiHullWidth: {
    title: 'Demi-hull width',
    text: 'Breadth of each demi-hull (catamaran) or the center hull (trimaran). Sets individual hull volume in the multi-hull strip model.',
  },
}

export const MULTIHULL_PARAM_HELP: Partial<
  Record<keyof HullParams, Partial<Record<'catamaran' | 'trimaran', { title: string; text: string }>>>
> = {
  beam: {
    catamaran: {
      title: 'Hull spacing',
      text: 'Centre-to-centre spacing between the two demi-hulls. Wider spacing increases transverse stability from the separated buoyancy pockets.',
    },
    trimaran: {
      title: 'Ama spacing',
      text: 'Span from the center hull to each outrigger (ama). Wider spacing increases form stability when the amas engage.',
    },
  },
  demiHullWidth: {
    catamaran: {
      title: 'Demi-hull beam',
      text: 'Breadth of each individual demi-hull tube. Narrower demi-hulls are shallower but lighter per hull.',
    },
    trimaran: {
      title: 'Center hull beam',
      text: 'Breadth of the main center hull. The amas use the demi-hull width parameter on the outboard hulls.',
    },
  },
}
