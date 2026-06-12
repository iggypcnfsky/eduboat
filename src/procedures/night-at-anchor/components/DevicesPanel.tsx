import { useMemo } from 'react'
import { Toggle } from '../../../ui/Toggle'
import { useSim, useSnapshot } from '../store'
import { DEVICES } from '../sim/devices'
import { forecast } from '../sim/engine'
import { EVENT_MINUTES, DAY_MINUTES } from '../sim/constants'
import { HotspotIcon } from '../three/HotspotIcon'
import { PanelCard } from './PanelCard'

export function DevicesPanel() {
  const snap = useSnapshot()
  const config = useSim((s) => s.config)
  const toggleDevice = useSim((s) => s.toggleDevice)
  const setAllDevices = useSim((s) => s.setAllDevices)
  const selected = useSim((s) => s.selected)
  const select = useSim((s) => s.select)

  const allOn = useMemo(() => DEVICES.every((d) => config.devicesEnabled[d.id]), [config.devicesEnabled])
  const allOff = useMemo(() => DEVICES.every((d) => !config.devicesEnabled[d.id]), [config.devicesEnabled])

  const { label, ah } = useMemo(() => {
    const untilMorning = snap.minute < EVENT_MINUTES.morning
    const until = untilMorning ? EVENT_MINUTES.morning : DAY_MINUTES
    const f = forecast(snap, config, until)
    return {
      label: untilMorning ? 'Tonight (to 08:00)' : 'Rest of day (to 18:00)',
      ah: f.ahOut - snap.ahOut,
    }
  }, [snap, config])

  return (
    <PanelCard title="Devices" className="naa-card--devices">
      <div className="dev-bulk">
        <button
          type="button"
          className={`dev-bulk__btn ${allOn ? 'is-active' : ''}`}
          onClick={() => setAllDevices(true)}
        >
          All on
        </button>
        <button
          type="button"
          className={`dev-bulk__btn ${allOff ? 'is-active' : ''}`}
          onClick={() => setAllDevices(false)}
        >
          All off
        </button>
      </div>
      <ul className="dev-list">
        {DEVICES.map((dev) => {
          const enabled = config.devicesEnabled[dev.id]
          const drawing = snap.loads[dev.id] > 0
          return (
            <li key={dev.id}>
              <div
                role="button"
                tabIndex={0}
                className={`dev-row ${enabled ? '' : 'is-off'} ${drawing ? 'is-drawing' : ''} ${selected === dev.id ? 'is-selected' : ''}`}
                onClick={() => select(selected === dev.id ? null : dev.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') select(selected === dev.id ? null : dev.id)
                }}
              >
                <span className={`dev-row__icon ${drawing ? 'is-drawing' : ''}`} aria-hidden>
                  <HotspotIcon id={dev.id} size={16} />
                </span>
                <span className="dev-row__name">{dev.name}</span>
                <span className={`dev-row__amps num ${drawing ? 'is-drawing' : ''}`}>
                  {drawing ? `${snap.loads[dev.id].toFixed(1)} A` : `${dev.amps.toFixed(1)} A`}
                </span>
                <span onClick={(e) => e.stopPropagation()}>
                  <Toggle on={enabled} label={dev.name} onChange={() => toggleDevice(dev.id)} />
                </span>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="naa-total">
        <span className="naa-total__label">{label}</span>
        <span className="naa-total__value num">−{ah.toFixed(0)} Ah</span>
      </div>
    </PanelCard>
  )
}
