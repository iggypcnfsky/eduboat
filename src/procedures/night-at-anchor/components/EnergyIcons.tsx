/** Cyan “energy in” — arrow into bank. */
export function EnergyInIcon() {
  return (
    <svg className="flow-icon flow-icon--in" width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <circle cx="9" cy="9" r="7.5" fill="rgba(95,212,196,0.12)" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 12V6M9 6L6.5 8.5M9 6l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

/** Amber “energy out” — arrow from bank. */
export function EnergyOutIcon() {
  return (
    <svg className="flow-icon flow-icon--out" width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <circle cx="9" cy="9" r="7.5" fill="rgba(240,163,94,0.12)" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 6v6M9 12l-2.5-2.5M9 12l2.5-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function SolarInIcon() {
  return (
    <svg className="flow-icon flow-icon--in" width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <circle cx="7" cy="7" r="2.2" fill="currentColor" />
      <path d="M7 1v1.6M7 11.4V13M1 7h1.6M11.4 7H13M2.8 2.8l1.1 1.1M10.1 10.1l1.1 1.1M2.8 11.2l1.1-1.1M10.1 3.9l1.1-1.1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

export function AltInIcon() {
  return (
    <svg className="flow-icon flow-icon--in" width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M7 3.5v4.5l2.8 1.6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function LoadOutIcon() {
  return (
    <svg className="flow-icon flow-icon--out" width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path d="M7 1.5L9.2 6H12l-2.8 2.1 1 3.4L7 9.8 3.8 11.5l1-3.4L2 6h2.8L7 1.5z" fill="currentColor" opacity="0.85" />
    </svg>
  )
}

export function BankFlowIcon({ direction }: { direction: 'in' | 'out' }) {
  return direction === 'in' ? (
    <svg className="flow-icon flow-icon--in" width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <rect x="3" y="4" width="8" height="7" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M7 2v2M5.5 2h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M7 8V6M7 6l-1.2 1.2M7 6l1.2 1.2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ) : (
    <svg className="flow-icon flow-icon--out" width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <rect x="3" y="4" width="8" height="7" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M7 2v2M5.5 2h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M7 6v2M7 8l-1.2-1.2M7 8l1.2-1.2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}
