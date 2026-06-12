import { PROCEDURES, DEFAULT_PROCEDURE_ID } from './procedures/registry'

export function App() {
  // Single procedure for now; the registry is the extension point for more.
  const procedure = PROCEDURES.find((p) => p.id === DEFAULT_PROCEDURE_ID) ?? PROCEDURES[0]
  const Component = procedure.component
  return <Component />
}
