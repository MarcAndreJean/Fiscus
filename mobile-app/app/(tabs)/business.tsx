import React from 'react'

import {
  BusinessMode,
  CarExpensesPage,
  ExpensesPage,
  HouseExpensesPage,
  IncomesPage,
  MiscFilesPage,
  ReportsPage,
  TravelLogsPage,
  useAppContext,
} from '@/lib'

const PAGES: Record<BusinessMode, React.ComponentType> = {
  expenses: ExpensesPage,
  incomes: IncomesPage,
  'car-expenses': CarExpensesPage,
  'house-expenses': HouseExpensesPage,
  'travel-logs': TravelLogsPage,
  'misc-files': MiscFilesPage,
  reports: ReportsPage,
}

const TabsBusiness = () => {
  const { appContext } = useAppContext()
  const Page = PAGES[appContext.businessMode]
  return <Page />
}

export default TabsBusiness
