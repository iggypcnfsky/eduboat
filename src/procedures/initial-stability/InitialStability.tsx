import './initial-stability.css'
import { StabilityHeader } from './components/StabilityHeader'
import { HullDiagram } from './components/HullDiagram'
import { ControlsPanel } from './components/ControlsPanel'
import { EquationsPanel, ValueReadout } from './components/EquationsPanel'
import { GzCurveChart } from './components/GzCurveChart'
import { WorkspaceLayout } from './components/WorkspaceLayout'

export function InitialStability() {
  return (
    <div className="is">
      <StabilityHeader />
      <WorkspaceLayout
        panels={{
          controls: <ControlsPanel />,
          diagram: <HullDiagram />,
          equations: <EquationsPanel />,
          gzChart: <GzCurveChart />,
          values: <ValueReadout />,
        }}
      />
    </div>
  )
}
