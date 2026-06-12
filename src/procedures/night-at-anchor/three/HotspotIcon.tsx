import type { ElementId } from '../sim/types'

/** Tiny stroke icons for 3D hotspots and device list. */
export function HotspotIcon({ id, size = 12 }: { id: ElementId; size?: number }) {
  const s = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 12 12">
      {id === 'fridge' && (
        <g {...s}>
          <path d="M6 1v10M2 3l8 6M10 3L2 9M6 1L4.6 2.4M6 1l1.4 1.4M6 11l-1.4-1.4M6 11l1.4-1.4" />
        </g>
      )}
      {id === 'anchorLight' && (
        <g {...s}>
          <circle cx="6" cy="6" r="2" />
          <path d="M6 1v1.4M6 9.6V11M1 6h1.4M9.6 6H11M2.5 2.5l1 1M8.5 8.5l1 1M9.5 2.5l-1 1M3.5 8.5l-1 1" />
        </g>
      )}
      {id === 'cabinLights' && (
        <g {...s}>
          <path d="M4 9.5h4M4.7 11h2.6" />
          <path d="M6 1a3.2 3.2 0 0 1 1.8 5.8c-.5.4-.8.7-.8 1.2H5c0-.5-.3-.8-.8-1.2A3.2 3.2 0 0 1 6 1z" />
        </g>
      )}
      {id === 'cockpitLights' && (
        <g {...s}>
          <path d="M2 8h8M3 8V5.5a3 3 0 0 1 6 0V8" />
          <path d="M6 2.5v1.2" />
        </g>
      )}
      {id === 'plotter' && (
        <g {...s}>
          <rect x="1.5" y="2.5" width="9" height="6" rx="1" />
          <path d="M4 11h4M3.5 6.5l2-2 1.5 1.5 2-2" />
        </g>
      )}
      {id === 'vhf' && (
        <g {...s}>
          <path d="M6 11V5M6 5a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 6 5z" />
          <path d="M2.8 1.6a4.6 4.6 0 0 0 0 4M9.2 1.6a4.6 4.6 0 0 1 0 4" />
        </g>
      )}
      {id === 'ais' && (
        <g {...s}>
          <path d="M6 2v7M3.5 9h5" />
          <circle cx="6" cy="2" r="1.2" />
          <path d="M4 5.5h4" />
        </g>
      )}
      {id === 'autopilot' && (
        <g {...s}>
          <circle cx="6" cy="6" r="4" />
          <path d="M6 3v3l2 1.2" />
        </g>
      )}
      {id === 'waterPump' && (
        <g {...s}>
          <path d="M6 1.5C7.8 4 9.5 5.8 9.5 7.7a3.5 3.5 0 0 1-7 0C2.5 5.8 4.2 4 6 1.5z" />
        </g>
      )}
      {id === 'usb' && (
        <g {...s}>
          <path d="M6.8 1L3.5 6.5h2L5.2 11l3.3-5.5h-2z" />
        </g>
      )}
      {id === 'laptop' && (
        <g {...s}>
          <rect x="2" y="3" width="8" height="5.5" rx="0.8" />
          <path d="M1.5 9h9" />
        </g>
      )}
      {id === 'wifiRouter' && (
        <g {...s}>
          <rect x="2.5" y="5" width="7" height="3.5" rx="0.6" />
          <path d="M3.5 5V3.8a2.5 2.5 0 0 1 5 0V5M6 8.5v1.5" />
        </g>
      )}
      {id === 'inverter' && (
        <g {...s}>
          <rect x="2" y="3" width="8" height="6" rx="1" />
          <path d="M4.5 6h3M6 4.5v3" />
        </g>
      )}
      {id === 'stereo' && (
        <g {...s}>
          <rect x="2" y="4" width="8" height="4" rx="0.8" />
          <circle cx="4.2" cy="6" r="0.8" />
          <circle cx="7.8" cy="6" r="0.8" />
        </g>
      )}
      {id === 'fans' && (
        <g {...s}>
          <circle cx="6" cy="6" r="3.5" />
          <path d="M6 2.5v7M2.5 6h7M3.8 3.8l4.4 4.4M8.2 3.8l-4.4 4.4" />
        </g>
      )}
      {id === 'heater' && (
        <g {...s}>
          <path d="M6 1c1 1.8 3.2 3 3.2 5.8A3.4 3.4 0 0 1 6 10.6 3.4 3.4 0 0 1 2.8 6.8C2.8 4.6 5 3.4 6 1z" />
          <path d="M6 10.6c-1 0-1.6-.8-1.4-1.8.2-.8 1-1.4 1.4-2.2.4.8 1.2 1.4 1.4 2.2.2 1-.4 1.8-1.4 1.8z" />
        </g>
      )}
      {id === 'radar' && (
        <g {...s}>
          <path d="M6 9V4M4 9h4" />
          <path d="M6 4a4 4 0 0 1 3.5 2" />
          <circle cx="6" cy="9" r="0.8" fill="currentColor" stroke="none" />
        </g>
      )}
      {id === 'bilgePump' && (
        <g {...s}>
          <rect x="3" y="4" width="6" height="5" rx="0.8" />
          <path d="M6 2v2M4 9h4" />
        </g>
      )}
      {id === 'alternator' && (
        <g {...s}>
          <circle cx="6" cy="6" r="4.5" />
          <path d="M6.8 3L4.5 6.4h1.8L5.2 9l2.3-3.4H5.7z" />
        </g>
      )}
      {id === 'solar' && (
        <g {...s}>
          <rect x="2" y="3" width="8" height="6" rx="0.8" />
          <path d="M4.7 3v6M7.3 3v6M2 6h8" />
        </g>
      )}
      {id === 'shore' && (
        <g {...s}>
          <circle cx="6" cy="6" r="4.5" />
          <path d="M4.5 4.5v1.2a1.5 1.5 0 0 0 3 0V4.5M6 7.2V9" />
        </g>
      )}
      {id === 'battery' && (
        <g {...s}>
          <rect x="1.5" y="3.5" width="8" height="5" rx="1" />
          <path d="M10.5 5v2M3 5.5v1M5 5.5v1M7 5.5v1" />
        </g>
      )}
    </svg>
  )
}
