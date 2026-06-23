import { useState } from 'react'
import { HubHome } from './hub/HubHome'
import { CategoryPage } from './hub/CategoryPage'
import { AppNavProvider } from './nav/AppNavContext'
import { getCategory, getProcedure } from './procedures/registry'

type Screen = 'hub' | 'category' | 'simulator'

export function App() {
  const [screen, setScreen] = useState<Screen>('hub')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [procedureId, setProcedureId] = useState<string | null>(null)

  if (screen === 'hub') {
    return (
      <HubHome
        onSelectCategory={(id) => {
          setCategoryId(id)
          setScreen('category')
        }}
      />
    )
  }

  if (screen === 'category' && categoryId) {
    return (
      <CategoryPage
        categoryId={categoryId}
        onBack={() => {
          setCategoryId(null)
          setScreen('hub')
        }}
        onSelectProcedure={(id) => {
          setProcedureId(id)
          setScreen('simulator')
        }}
      />
    )
  }

  if (screen === 'simulator' && procedureId && categoryId) {
    const procedure = getProcedure(procedureId)
    const category = getCategory(categoryId)
    if (procedure && category) {
      const Component = procedure.component
      return (
        <AppNavProvider
          value={{
            categoryTitle: category.title,
            onBack: () => {
              setProcedureId(null)
              setScreen('category')
            },
          }}
        >
          <Component />
        </AppNavProvider>
      )
    }
  }

  return (
    <HubHome
      onSelectCategory={(id) => {
        setCategoryId(id)
        setScreen('category')
      }}
    />
  )
}
