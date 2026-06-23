import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CustomHullDesign } from './sim/custom-hull'

interface CustomHullLibraryState {
  designs: CustomHullDesign[]
  list: () => CustomHullDesign[]
  get: (id: string) => CustomHullDesign | undefined
  save: (design: CustomHullDesign) => void
  rename: (id: string, name: string) => void
  remove: (id: string) => void
}

export const useCustomHullStore = create<CustomHullLibraryState>()(
  persist(
    (set, get) => ({
      designs: [],

      list: () => get().designs,

      get: (id) => get().designs.find((d) => d.id === id),

      save: (design) => {
        const now = Date.now()
        const next: CustomHullDesign = { ...design, updatedAt: now }
        set((state) => {
          const idx = state.designs.findIndex((d) => d.id === design.id)
          if (idx >= 0) {
            const designs = [...state.designs]
            designs[idx] = next
            return { designs }
          }
          return {
            designs: [...state.designs, { ...next, createdAt: design.createdAt || now }],
          }
        })
      },

      rename: (id, name) => {
        const trimmed = name.trim()
        if (!trimmed) return
        set((state) => ({
          designs: state.designs.map((d) =>
            d.id === id ? { ...d, name: trimmed, updatedAt: Date.now() } : d,
          ),
        }))
      },

      remove: (id) => {
        set((state) => ({ designs: state.designs.filter((d) => d.id !== id) }))
      },
    }),
    { name: 'eduboat-custom-hulls-v1' },
  ),
)

/** Non-React access for sim geometry builders. */
export function getCustomHullDesign(id: string | null | undefined): CustomHullDesign | undefined {
  if (!id) return undefined
  return useCustomHullStore.getState().get(id)
}
