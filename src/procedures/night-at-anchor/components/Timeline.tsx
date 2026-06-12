import { useCallback, useRef, useState } from 'react'
import { useSim, useSnapshot } from '../store'
import { formatTod } from '../sim/engine'
import { DAY_MINUTES, EVENT_MINUTES } from '../sim/constants'

const EVENTS: Array<{ minute: number; label: string; icon: 'moon' | 'star' | 'sun' | 'check' }> = [
  { minute: EVENT_MINUTES.dusk, label: 'Dusk', icon: 'moon' },
  { minute: EVENT_MINUTES.midnight, label: 'Midnight', icon: 'star' },
  { minute: EVENT_MINUTES.dawn, label: 'Dawn', icon: 'sun' },
  { minute: EVENT_MINUTES.morning, label: 'Morning check', icon: 'check' },
]

function EventIcon({ icon }: { icon: 'moon' | 'star' | 'sun' | 'check' }) {
  switch (icon) {
    case 'moon':
      return <path d="M7 1.5a4.5 4.5 0 1 0 4.4 5.6A3.6 3.6 0 0 1 7 1.5z" fill="#8FA3B0" />
    case 'star':
      return <path d="M6 0.5l1.3 3.4 3.4 0.3-2.6 2.3 0.8 3.5L6 8.2 3.1 10l0.8-3.5L1.3 4.2l3.4-0.3z" fill="#8FA3B0" transform="translate(1 1)" />
    case 'sun':
      return (
        <g stroke="#E8B25A" strokeWidth="1.1" strokeLinecap="round">
          <circle cx="7" cy="7" r="2.6" fill="#E8B25A" stroke="none" />
          <path d="M7 1.2v1.8M7 11v1.8M1.2 7h1.8M11 7h1.8M2.9 2.9l1.3 1.3M9.8 9.8l1.3 1.3M11.1 2.9L9.8 4.2M4.2 9.8l-1.3 1.3" />
        </g>
      )
    case 'check':
      return <path d="M2.5 7.5l3 3 6-6.5" stroke="#5FD4C4" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  }
}

export function Timeline() {
  const snap = useSnapshot()
  const playing = useSim((s) => s.playing)
  const setPlaying = useSim((s) => s.setPlaying)
  const scrubTo = useSim((s) => s.scrubTo)

  const trackRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const [hover, setHover] = useState<{ minute: number; x: number } | null>(null)

  const minuteFromEvent = useCallback((clientX: number) => {
    const el = trackRef.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    const t = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return t * DAY_MINUTES
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    setPlaying(false)
    scrubTo(minuteFromEvent(e.clientX))
  }
  const updateHover = useCallback(
    (clientX: number) => {
      const el = trackRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setHover({ minute: minuteFromEvent(clientX), x: clientX - rect.left })
    },
    [minuteFromEvent],
  )

  const onPointerMove = (e: React.PointerEvent) => {
    updateHover(e.clientX)
    if (draggingRef.current) scrubTo(minuteFromEvent(e.clientX))
  }
  const onPointerUp = () => {
    draggingRef.current = false
  }
  const onPointerEnter = (e: React.PointerEvent) => updateHover(e.clientX)
  const onPointerLeave = () => setHover(null)

  const progress = snap.minute / DAY_MINUTES
  const nightStart = EVENT_MINUTES.dusk / DAY_MINUTES
  const nightEnd = EVENT_MINUTES.dawn / DAY_MINUTES

  const timeTip = hover
    ? { minute: hover.minute, left: hover.x }
    : playing
      ? { minute: snap.minute, left: `${progress * 100}%` }
      : null

  return (
    <div className="naa-timeline">
      <button
        type="button"
        className="naa-timeline__btn"
        onClick={() => setPlaying(!playing)}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? (
          <svg width="11" height="12" viewBox="0 0 13 14" aria-hidden>
            <rect x="1" y="1" width="4" height="12" rx="1.5" fill="currentColor" />
            <rect x="8" y="1" width="4" height="12" rx="1.5" fill="currentColor" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden>
            <path d="M3 1.5v11l9.5-5.5z" fill="currentColor" />
          </svg>
        )}
      </button>

      <div
        ref={trackRef}
        className="naa-timeline__track-wrap"
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        role="slider"
        aria-label="Timeline"
        aria-valuemin={0}
        aria-valuemax={DAY_MINUTES}
        aria-valuenow={Math.round(snap.minute)}
        aria-valuetext={formatTod(snap.minute)}
      >
        <svg width="100%" height="22" preserveAspectRatio="none" style={{ display: 'block' }}>
          <rect x="0" y="8" width="100%" height="5" rx="2.5" fill="rgba(143,163,176,0.18)" />
          <rect
            x={`${nightStart * 100}%`}
            y="8"
            width={`${(nightEnd - nightStart) * 100}%`}
            height="5"
            fill="rgba(10,20,31,0.85)"
            stroke="rgba(143,163,176,0.2)"
            strokeWidth="0.5"
          />
          <rect x="0" y="8" width={`${progress * 100}%`} height="5" rx="2.5" fill="#5FD4C4" opacity="0.85" />
        </svg>
        {EVENTS.map((ev) => (
          <div
            key={ev.label}
            title={`${ev.label} · ${formatTod(ev.minute)}`}
            className="naa-timeline__event"
            style={{ left: `${(ev.minute / DAY_MINUTES) * 100}%` }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden>
              <EventIcon icon={ev.icon} />
            </svg>
          </div>
        ))}
        <div className="naa-timeline__handle" style={{ left: `${progress * 100}%` }} />
        {timeTip && (
          <div className="naa-timeline__hover-time num" style={{ left: timeTip.left }}>
            {formatTod(timeTip.minute)}
          </div>
        )}
      </div>
    </div>
  )
}
