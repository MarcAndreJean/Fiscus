import { router } from 'expo-router'
import React from 'react'

import { houseExpenseTitle, houseExpenseTypeLabel } from './houseExpenseFields'
import {
  useDeleteHouseExpense,
  useHouseExpenses,
} from '../../../api/houseExpenses'
import { useAppContext } from '../../../context'
import { Locales } from '../../../locales'
import { detailsRoute, formRoute } from '../../../navigation'
import { useAuth } from '../../../settings'
import { formatDate, formatMoney, summaryLine } from '../../../utils/format'
import EntityListItem from '../shared/EntityListItem'
import EntityListPage from '../shared/EntityListPage'
import { IdFilter, YearFilter } from '../shared/ListFilters'

const HouseExpensesPage = () => {
  const auth = useAuth()
  const { appContext, updateAppContext } = useAppContext()
  const query = useHouseExpenses({
    houseId: appContext.currentHouseId,
    year: appContext.currentYear,
  })
  const deleteEntry = useDeleteHouseExpense()

  return (
    <EntityListPage
      filters={
        <>
          <YearFilter
            value={appContext.currentYear}
            onChange={(year) => updateAppContext({ currentYear: year })}
          />
          <IdFilter
            label={Locales.t('houseId')}
            ids={auth.houseIds}
            value={appContext.currentHouseId}
            onChange={(id) => updateAppContext({ currentHouseId: id })}
          />
        </>
      }
      items={query.data}
      isLoading={query.isLoading}
      error={query.error}
      refetch={query.refetch}
      keyOf={(expense) => expense.id}
      renderItem={(expense) => (
        <EntityListItem
          title={houseExpenseTitle(expense)}
          description={summaryLine(
            formatDate(expense.invoiceDate),
            formatMoney(expense.total),
            houseExpenseTypeLabel(expense),
          )}
          icon="home"
          onPress={() => router.push(detailsRoute('house-expense', expense.id))}
          onEdit={() => router.push(formRoute('house-expense', expense.id))}
          onDelete={() =>
            deleteEntry.mutateAsync({
              id: expense.id,
              invoiceDate: expense.invoiceDate,
            })
          }
        />
      )}
      onCreate={
        auth.houseIds.length
          ? () => router.push(formRoute('house-expense'))
          : undefined
      }
    />
  )
}

export default HouseExpensesPage
