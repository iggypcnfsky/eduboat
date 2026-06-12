import type { ReactNode } from 'react'
import { CHEMISTRIES } from '../sim/battery'
import { DEVICE_MAP } from '../sim/devices'
import type { DeviceId, SimConfig, Snapshot } from '../sim/types'

export interface SchematicLesson {
  id: string
  kicker: string
  title: string
  footnote?: string
  body: (ctx: { snap: Snapshot; config: SimConfig }) => ReactNode
}

export const SCHEMATIC_LESSONS: SchematicLesson[] = [
  {
    id: 'read-diagram',
    kicker: 'Lesson 1 · Diagram',
    title: 'How to read this schematic',
    footnote: 'EduBoat · Night at anchor',
    body: () => (
      <>
        <p className="naa-note">
          <strong style={{ color: 'var(--in)' }}>Teal flows</strong> are charge current into the bank — alternator and
          solar when they are producing. <strong style={{ color: 'var(--out)' }}>Amber flows</strong> are loads drawing
          from the bank.
        </p>
        <p className="naa-note">
          Click any tile to toggle a device or start the engine. Line thickness scales with amps — a fat line is a big
          consumer. The dashed red line on the bank marks the chemistry floor you should not cross.
        </p>
      </>
    ),
  },
  {
    id: 'charge-curve',
    kicker: 'Lesson 2 · Charging',
    title: 'Why the last 20% takes hours',
    footnote: 'Energy Unlimited (Victron Energy), ch. 4.2',
    body: ({ config }) => (
      <>
        <p className="naa-note">
          In <strong>bulk</strong>, the bank accepts everything the alternator gives. Near{' '}
          {CHEMISTRIES[config.chemistry].absorptionStartSoc}% SOC it switches to <strong>absorption</strong>: voltage
          holds steady and accepted current tapers. Watch the charge curve on the right rail — bulk is fast, the tail to
          full is not.
        </p>
        <p className="naa-note">
          Stopping mid-absorption again and again is what slowly kills lead-acid banks. One solid charge block beats
          three short engine runs.
        </p>
      </>
    ),
  },
  {
    id: 'soc-floor',
    kicker: 'Lesson 3 · Bank health',
    title: 'The floor line is not optional',
    footnote: 'Energy Unlimited (Victron Energy), ch. 2 & 4',
    body: ({ snap, config }) => {
      const chem = CHEMISTRIES[config.chemistry]
      const below = snap.soc < chem.floorSoc
      return (
        <>
          <p className="naa-note">
            Your {chem.label} bank has a recommended minimum of{' '}
            <span className="num">{chem.floorSoc}%</span> SOC — about{' '}
            <span className="num">{Math.round(chem.usableShare * 100)}%</span> of nameplate capacity is realistically
            usable.
          </p>
          <p className="naa-note">{chem.floorNote}</p>
          {below && (
            <p className="naa-note" style={{ color: 'var(--alarm)' }}>
              You are currently below the floor. Shed load or start charging.
            </p>
          )}
        </>
      )
    },
  },
  {
    id: 'overnight-loads',
    kicker: 'Lesson 4 · Overnight',
    title: 'What runs while you sleep',
    footnote: 'West Marine Electrical Budget Worksheet',
    body: ({ snap }) => {
      const ranked = (Object.entries(snap.loads) as Array<[DeviceId, number]>)
        .filter(([, a]) => a > 0.05)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
      return (
        <>
          <p className="naa-note">
            At anchor, &quot;always on&quot; loads add up quietly: plotter standby, AIS, anchor light after dusk, fridge
            cycling on a thermostat. Toggle devices on the diagram and watch net current change live.
          </p>
          {ranked.length > 0 ? (
            <ul className="naa-lesson__list">
              {ranked.map(([id, a]) => (
                <li key={id}>
                  <span>{DEVICE_MAP[id].name}</span>
                  <span className="num is-out">{a.toFixed(1)} A now</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="naa-note">Most loads are off right now — try enabling fridge, plotter and anchor light.</p>
          )}
        </>
      )
    },
  },
  {
    id: 'charge-planning',
    kicker: 'Lesson 5 · Planning',
    title: 'When to run the engine',
    footnote: 'Energy Unlimited (Victron Energy), ch. 4',
    body: ({ snap, config }) => {
      const net = snap.battA
      const hoursToFloor =
        net < -0.05
          ? ((snap.soc - CHEMISTRIES[config.chemistry].floorSoc) / 100) *
            config.capacityAh /
            Math.abs(net)
          : null
      return (
        <>
          <p className="naa-note">
            Net bank current is{' '}
            <span className={`num ${net >= 0 ? 'is-in' : 'is-out'}`}>
              {net >= 0 ? '+' : '−'}
              {Math.abs(net).toFixed(1)} A
            </span>{' '}
            right now. At anchor, aim to charge in a solid block — bulk is efficient; repeated short runs never reach
            absorption properly on lead-acid.
          </p>
          {hoursToFloor != null && hoursToFloor > 0 && hoursToFloor < 48 && (
            <p className="naa-note">
              At this load, roughly{' '}
              <span className="num">{hoursToFloor.toFixed(1)} h</span> until the {config.chemistry} floor — unless you
              charge or shed load.
            </p>
          )}
        </>
      )
    },
  },
  {
    id: 'energy-balance',
    kicker: 'Lesson 6 · Balance',
    title: 'Ah in vs Ah out',
    footnote: 'eMarine / West Marine budget worksheets',
    body: ({ snap, config }) => (
      <>
        <div className="naa-lesson__stats">
          <div>
            <span className="naa-lesson__stat-label">Consumed</span>
            <span className="naa-lesson__stat-val num is-out">{snap.ahOut.toFixed(0)} Ah</span>
          </div>
          <div>
            <span className="naa-lesson__stat-label">Charged</span>
            <span className="naa-lesson__stat-val num is-in">{snap.ahIn.toFixed(0)} Ah</span>
          </div>
          <div>
            <span className="naa-lesson__stat-label">SOC</span>
            <span className="naa-lesson__stat-val num">
              {config.startSoc}% → {snap.soc.toFixed(0)}%
            </span>
          </div>
        </div>
        <p className="naa-note">
          Scrub the timeline to replay the day. A quiet anchor night on a {config.capacityAh} Ah {config.chemistry}{' '}
          bank is often 40–80 Ah out — mostly fridge, nav electronics and lighting. Did you put more back in than you
          took?
        </p>
      </>
    ),
  },
]
