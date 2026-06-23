import { createContext, useContext, type ReactNode } from 'react'

export interface AppNav {
  onBack: () => void
  categoryTitle: string
}

const AppNavContext = createContext<AppNav | null>(null)

export function AppNavProvider({ value, children }: { value: AppNav; children: ReactNode }) {
  return <AppNavContext.Provider value={value}>{children}</AppNavContext.Provider>
}

export function useAppNav(): AppNav | null {
  return useContext(AppNavContext)
}
