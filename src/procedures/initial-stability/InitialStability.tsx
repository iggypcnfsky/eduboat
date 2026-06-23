import './initial-stability.css'
import { StabilityHeader } from './components/StabilityHeader'
import { HullDiagram } from './components/HullDiagram'
import { HullDesigner } from './components/HullDesigner'
import { ControlsPanel } from './components/ControlsPanel'
import { EquationsPanel, ValueReadout } from './components/EquationsPanel'
import { GzCurveChart } from './components/GzCurveChart'
import { WorkspaceLayout } from './components/WorkspaceLayout'
import { useStability } from './store'

export function InitialStability() {
  const designerOpen = useStability((s) => s.designerOpen)

  return (
    <div className="is">
      <StabilityHeader />
      <WorkspaceLayout
        panels={{
          controls: <ControlsPanel />,
          diagram: designerOpen ? <HullDesigner /> : <HullDiagram />,
          equations: <EquationsPanel />,
          gzChart: <GzCurveChart />,
          values: <ValueReadout />,
        }}
      />
    </div>
  )
}
