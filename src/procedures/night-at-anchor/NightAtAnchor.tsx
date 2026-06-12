import { useEffect, useRef } from 'react'
import './night-at-anchor.css'
import { useSim } from './store'
import { Header } from './components/Header'
import { SideRails } from './components/SideRails'
import { MobileTabs } from './components/MobileTabs'
import { BeatOverlay } from './components/BeatOverlay'
import { SourcesModal } from './components/SourcesModal'
import { Scene3D } from './three/Scene3D'
import { SchematicView } from './schematic/SchematicView'

/** Drives the simulation clock with requestAnimationFrame. */
function useSimClock() {
  const tick = useSim((s) => s.tick)
  const last = useRef<number | null>(null)
  useEffect(() => {
    let raf = 0
    const loop = (now: number) => {
      if (last.current !== null) tick(Math.min((now - last.current) / 1000, 0.25))
      last.current = now
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [tick])
}

export function NightAtAnchor() {
  useSimClock()
  const view = useSim((s) => s.view)
  const sheet = useSim((s) => s.sheet)
  const setSheet = useSim((s) => s.setSheet)

  return (
    <div className={`naa${view === 'schematic' ? ' is-schematic' : ''}`}>
      <div className="naa__stage">{view === '3d' ? <Scene3D /> : <SchematicView />}</div>

      <Header />

      {sheet && <div className="naa__scrim" onClick={() => setSheet(null)} />}
      <SideRails />

      <MobileTabs />

      <BeatOverlay />
      <SourcesModal />
    </div>
  )
}
