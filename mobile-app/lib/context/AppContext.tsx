import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import type { BusinessMode } from './businessModes'
import { useAuth } from '../settings'
import { CarExpenseType, ExpenseType, HouseExpenseType } from '../types'

export type AppContextType = {
  businessMode: BusinessMode
  currentBusinessId: string
  currentCarId: string
  currentHouseId: string
  currentYear: number
  lastBusinessExpenseType: ExpenseType
  lastCarExpenseType: CarExpenseType
  lastHouseExpenseType: HouseExpenseType
}

export const DEFAULT_APP_CONTEXT: AppContextType = {
  businessMode: 'expenses',
  currentBusinessId: '',
  currentCarId: '',
  currentHouseId: '',
  currentYear: new Date().getFullYear(),
  lastBusinessExpenseType: ExpenseType.OfficeStationeryAndSupplies,
  lastCarExpenseType: CarExpenseType.Gaz,
  lastHouseExpenseType: HouseExpenseType.Maintenance,
}

type AppContextValue = {
  appContext: AppContextType
  updateAppContext: (patch: Partial<AppContextType>) => void
}

const AppContext = createContext<AppContextValue | null>(null)

/** Keeps the selected id if it is still configured, else picks the first one. */
const pickId = (current: string, ids: string[]): string =>
  ids.includes(current) ? current : (ids[0] ?? '')

export function AppContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = useAuth()
  const [appContext, setAppContext] = useState(DEFAULT_APP_CONTEXT)

  const updateAppContext = useCallback(
    (patch: Partial<AppContextType>) =>
      setAppContext((previous) => ({ ...previous, ...patch })),
    [],
  )

  useEffect(() => {
    if (auth.isLoading) return
    setAppContext((previous) => ({
      ...previous,
      currentBusinessId: pickId(previous.currentBusinessId, auth.businessIds),
      currentCarId: pickId(previous.currentCarId, auth.carIds),
      currentHouseId: pickId(previous.currentHouseId, auth.houseIds),
    }))
  }, [auth.isLoading, auth.businessIds, auth.carIds, auth.houseIds])

  const value = useMemo(
    () => ({ appContext, updateAppContext }),
    [appContext, updateAppContext],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextValue {
  const value = useContext(AppContext)
  if (!value) {
    throw new Error('useAppContext must be used inside <AppContextProvider>')
  }
  return value
}
