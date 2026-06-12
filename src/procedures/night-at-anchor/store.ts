import { create } from 'zustand'
import type { BeatId, Chemistry, DeviceId, ElementId, SimConfig, Snapshot } from './sim/types'
import { defaultDevicesEnabled, DEVICES } from './sim/devices'
import { CHEMISTRIES } from './sim/battery'
import { initialSnapshot, step } from './sim/engine'
import { DAY_MINUTES, EVENT_MINUTES, DEFAULT_START_FUEL_L, INITIAL_SOC, FUEL_TANK_L } from './sim/constants'

export type ViewMode = '3d' | 'schematic'
export type MobileSheet = 'setup' | 'energy' | null

interface SimState {
  config: SimConfig
  /** Snapshot per simulated minute; index === minute. */
  history: Snapshot[]
  /** Currently viewed minute (integer index into history). */
  cursor: number
  playing: boolean
  /** Simulated minutes per real second. */
  speed: number
  view: ViewMode
  selected: ElementId | null
  activeBeat: BeatId | null
  beatsSeen: Record<BeatId, boolean>
  sourcesOpen: boolean
  schematicLessonsOpen: boolean
  sheet: MobileSheet

  tick: (dtSeconds: number) => void
  scrubTo: (minute: number) => void
  setPlaying: (playing: boolean) => void
  setSpeed: (speed: number) => void
  toggleDevice: (id: DeviceId) => void
  setAllDevices: (on: boolean) => void
  setEngine: (on: boolean) => void
  setShorePower: (on: boolean) => void
  setCloudCover: (v: number) => void
  setCapacity: (ah: 200 | 300 | 400) => void
  setChemistry: (c: Chemistry) => void
  setStartSoc: (soc: number) => void
  setStartFuel: (litres: number) => void
  setView: (v: ViewMode) => void
  select: (id: ElementId | null) => void
  dismissBeat: () => void
  setSourcesOpen: (open: boolean) => void
  setSchematicLessonsOpen: (open: boolean) => void
  setSheet: (sheet: MobileSheet) => void
  restart: () => void
}

const defaultConfig = (): SimConfig => ({
  capacityAh: 300,
  chemistry: 'AGM',
  cloudCover: 0.25,
  engineOn: false,
  shorePowerOn: false,
  devicesEnabled: defaultDevicesEnabled(),
  startSoc: INITIAL_SOC,
  startFuelL: DEFAULT_START_FUEL_L,
})

const noBeatsSeen = (): Record<BeatId, boolean> => ({
  'night-summary': false,
  'engine-charging': false,
  'soc-floor': false,
  'day-summary': false,
})

// Fractional minute accumulator lives outside the store — it never needs to render.
let acc = 0

export const useSim = create<SimState>((set, get) => {
  /** Any configuration change while viewing the past invalidates the recorded future. */
  const mutateConfig = (patch: Partial<SimConfig>) => {
    const { config, history, cursor } = get()
    set({
      config: { ...config, ...patch },
      history: cursor < history.length - 1 ? history.slice(0, cursor + 1) : history,
    })
  }

  const maybeTriggerBeat = (snap: Snapshot): BeatId | null => {
    const { beatsSeen, config } = get()
    if (snap.minute >= DAY_MINUTES && !beatsSeen['day-summary']) return 'day-summary'
    if (snap.soc < CHEMISTRIES[config.chemistry].floorSoc && !beatsSeen['soc-floor'])
      return 'soc-floor'
    if (snap.minute >= EVENT_MINUTES.morning && !beatsSeen['night-summary'])
      return 'night-summary'
    return null
  }

  const rebuildHistory = (config: SimConfig, untilMinute: number): Snapshot[] => {
    const history = [initialSnapshot(config)]
    while (history[history.length - 1].minute < untilMinute) {
      history.push(step(history[history.length - 1], config))
    }
    return history
  }

  return {
    config: defaultConfig(),
    history: [initialSnapshot(defaultConfig())],
    cursor: 0,
    playing: false,
    speed: 10,
    view: '3d',
    selected: null,
    activeBeat: null,
    beatsSeen: noBeatsSeen(),
    sourcesOpen: false,
    schematicLessonsOpen: true,
    sheet: null,

    tick: (dtSeconds) => {
      const state = get()
      if (!state.playing || state.activeBeat) return
      acc += dtSeconds * state.speed
      let steps = Math.floor(acc)
      if (steps <= 0) return
      acc -= steps

      const history = state.history.slice()
      let cursor = state.cursor
      let beat: BeatId | null = null

      while (steps-- > 0 && cursor < DAY_MINUTES) {
        if (cursor < history.length - 1) {
          cursor++
        } else {
          const next = step(history[history.length - 1], state.config)
          history.push(next)
          cursor++
        }
        beat = maybeTriggerBeat(history[cursor])
        if (beat) break
      }

      const done = cursor >= DAY_MINUTES
      set({
        history,
        cursor,
        playing: !beat && !done,
        activeBeat: beat,
        beatsSeen: beat ? { ...get().beatsSeen, [beat]: true } : get().beatsSeen,
      })
    },

    scrubTo: (minute) => {
      const target = Math.max(0, Math.min(DAY_MINUTES, Math.round(minute)))
      const { history, config } = get()
      if (target <= history.length - 1) {
        set({ cursor: target })
        return
      }
      const extended = history.slice()
      while (extended.length - 1 < target) {
        extended.push(step(extended[extended.length - 1], config))
      }
      set({ history: extended, cursor: target })
    },

    setPlaying: (playing) => {
      acc = 0
      const { cursor } = get()
      // Restart from the top if the day is over.
      if (playing && cursor >= DAY_MINUTES) {
        get().restart()
        set({ playing: true })
        return
      }
      set({ playing })
    },

    setSpeed: (speed) => set({ speed }),

    toggleDevice: (id) => {
      const enabled = get().config.devicesEnabled
      mutateConfig({ devicesEnabled: { ...enabled, [id]: !enabled[id] } })
    },

    setAllDevices: (on) => {
      const enabled = Object.fromEntries(DEVICES.map((d) => [d.id, on])) as Record<DeviceId, boolean>
      mutateConfig({ devicesEnabled: enabled })
    },

    setEngine: (on) => {
      mutateConfig({ engineOn: on })
      if (on && !get().beatsSeen['engine-charging']) {
        set({
          activeBeat: 'engine-charging',
          beatsSeen: { ...get().beatsSeen, 'engine-charging': true },
          playing: false,
        })
      }
    },

    setShorePower: (on) => mutateConfig({ shorePowerOn: on }),

    setCloudCover: (v) => mutateConfig({ cloudCover: v }),
    setCapacity: (ah) => mutateConfig({ capacityAh: ah }),
    setChemistry: (c) => {
      const floor = CHEMISTRIES[c].floorSoc
      mutateConfig({ chemistry: c, startSoc: Math.max(get().config.startSoc, floor) })
    },

    setStartSoc: (soc) => {
      const { config, cursor } = get()
      const floor = CHEMISTRIES[config.chemistry].floorSoc
      const startSoc = Math.round(Math.max(floor, Math.min(100, soc)))
      const next = { ...config, startSoc }
      set({ config: next, history: rebuildHistory(next, cursor) })
    },

    setStartFuel: (litres) => {
      const { config, cursor } = get()
      const startFuelL = Math.round(Math.max(0, Math.min(FUEL_TANK_L, litres)))
      const next = { ...config, startFuelL }
      set({ config: next, history: rebuildHistory(next, cursor) })
    },

    setView: (view) => set({ view }),
    select: (selected) => set({ selected }),

    dismissBeat: () => {
      const { cursor } = get()
      set({ activeBeat: null, playing: cursor < DAY_MINUTES })
    },

    setSourcesOpen: (sourcesOpen) => set({ sourcesOpen }),
    setSchematicLessonsOpen: (schematicLessonsOpen) => set({ schematicLessonsOpen }),
    setSheet: (sheet) => set({ sheet }),

    restart: () => {
      acc = 0
      const config = defaultConfig()
      set({
        config,
        history: [initialSnapshot(config)],
        cursor: 0,
        playing: false,
        activeBeat: null,
        beatsSeen: noBeatsSeen(),
      })
    },
  }
})

/** The snapshot currently shown in both views. */
export const useSnapshot = (): Snapshot => useSim((s) => s.history[Math.min(s.cursor, s.history.length - 1)])
