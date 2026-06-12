/** Simulation clock: 24 h from 18:00 to 18:00 the next day, in minutes. */
export const DAY_MINUTES = 1440

/** Time-of-day (minutes from midnight) of the simulation start. */
export const START_TOD = 18 * 60 // 18:00

/** June anchorage assumptions (time-of-day, minutes from midnight). */
export const DUSK_TOD = 21 * 60 + 15 // 21:15 — anchor light on
export const DAWN_TOD = 5 * 60 + 30 // 05:30 — anchor light off
export const SUNRISE_TOD = 5 * 60 + 30
export const SUNSET_TOD = 21 * 60 + 15

/** Morning SOC-check ritual. */
export const MORNING_TOD = 8 * 60 // 08:00

/** Minutes since sim start for key timeline events. */
export const todToMinute = (tod: number) => (tod - START_TOD + DAY_MINUTES) % DAY_MINUTES

export const EVENT_MINUTES = {
  dusk: todToMinute(DUSK_TOD), // 195
  midnight: todToMinute(0), // 360
  dawn: todToMinute(DAWN_TOD), // 690
  morning: todToMinute(MORNING_TOD), // 840
} as const

/** Nominal system voltage used to convert solar watts to amps. */
export const SYSTEM_VOLTAGE = 13

/**
 * Alternator rated output, amps.
 * Source: typical 60–80 A marine alternator (research doc, sec. 12-F);
 * real charge current is limited by bank acceptance — that is the lesson.
 */
export const ALTERNATOR_RATED_A = 70

/** Shore-power charger output when connected, amps (typical 30 A marine charger). */
export const SHORE_CHARGER_A = 30

/** Solar array size, watts. ~50–60 Ah/day in fair weather (research doc, sec. 12-F). */
export const SOLAR_W = 200

/** Starting SOC when the simulation begins at 18:00 (after a day of sailing). */
export const INITIAL_SOC = 85

/** Diesel tank on a typical 30–35 ft cruiser, litres. */
export const FUEL_TANK_L = 40

/** Typical starting fuel when arriving at anchor (not a full tank). */
export const DEFAULT_START_FUEL_L = 28

/**
 * Small sailboat diesel at low load while charging the bank, litres per hour.
 * Source: Yanmar 2GM-class ~1–1.5 L/h at anchor RPM (manufacturer data, rounded).
 */
export const FUEL_CONSUMPTION_LPH = 1.4
