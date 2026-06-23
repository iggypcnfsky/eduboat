import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PanelId = 'controls' | 'diagram' | 'equations' | 'gzChart' | 'values'

export type SlotId = 'left' | 'center' | 'rightTop' | 'rightMid' | 'rightBottom'

export const PANEL_TITLES: Record<PanelId, string> = {
  controls: 'Controls',
  diagram: 'Hull cross-section',
  equations: 'Equations',
  gzChart: 'GZ curve',
  values: 'Live values',
}

export const DEFAULT_SLOTS: Record<SlotId, PanelId> = {
  left: 'controls',
  center: 'diagram',
  rightTop: 'equations',
  rightMid: 'gzChart',
  rightBottom: 'values',
}

export interface WorkspaceSizes {
  leftColPx: number
  rightColPx: number
  rightTopPct: number
  rightMidPct: number
}

const DEFAULT_SIZES: WorkspaceSizes = {
  leftColPx: 260,
  rightColPx: 320,
  rightTopPct: 32,
  rightMidPct: 38,
}

interface WorkspaceState {
  slots: Record<SlotId, PanelId>
  sizes: WorkspaceSizes
  movePanelToSlot: (panelId: PanelId, targetSlot: SlotId) => void
  setLeftColPx: (px: number) => void
  setRightColPx: (px: number) => void
  setRightTopPct: (pct: number) => void
  setRightMidPct: (pct: number) => void
  resetLayout: () => void
}

export const useWorkspace = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      slots: { ...DEFAULT_SLOTS },
      sizes: { ...DEFAULT_SIZES },

      movePanelToSlot: (panelId, targetSlot) => {
        const slots = { ...get().slots }
        const sourceSlot = (Object.keys(slots) as SlotId[]).find((k) => slots[k] === panelId)
        if (!sourceSlot || sourceSlot === targetSlot) return
        const displaced = slots[targetSlot]
        slots[targetSlot] = panelId
        slots[sourceSlot] = displaced
        set({ slots })
      },

      setLeftColPx: (px) => set({ sizes: { ...get().sizes, leftColPx: Math.max(160, Math.min(480, px)) } }),
      setRightColPx: (px) => set({ sizes: { ...get().sizes, rightColPx: Math.max(220, Math.min(560, px)) } }),
      setRightTopPct: (pct) =>
        set({ sizes: { ...get().sizes, rightTopPct: Math.max(18, Math.min(55, pct)) } }),
      setRightMidPct: (pct) =>
        set({ sizes: { ...get().sizes, rightMidPct: Math.max(20, Math.min(55, pct)) } }),

      resetLayout: () => set({ slots: { ...DEFAULT_SLOTS }, sizes: { ...DEFAULT_SIZES } }),
    }),
    { name: 'eduboat-stability-workspace-v2' },
  ),
)
