import { router } from 'expo-router'
import React from 'react'

import { carExpenseTitle, carExpenseTypeLabel } from './carExpenseFields'
import { useCarExpenses, useDeleteCarExpense } from '../../../api/carExpenses'
import { useAppContext } from '../../../context'
import { Locales } from '../../../locales'
import { detailsRoute, formRoute } from '../../../navigation'
import { useAuth } from '../../../settings'
import { formatDate, formatMoney, summaryLine } from '../../../utils/format'
import EntityListItem from '../shared/EntityListItem'
import EntityListPage from '../shared/EntityListPage'
import { IdFilter, YearFilter } from '../shared/ListFilters'

const CarExpensesPage = () => {
  const auth = useAuth()
  const { appContext, updateAppContext } = useAppContext()
  const query = useCarExpenses({
    carId: appContext.currentCarId,
    year: appContext.currentYear,
  })
  const deleteEntry = useDeleteCarExpense()

  return (
    <EntityListPage
      filters={
        <>
          <YearFilter
            value={appContext.currentYear}
            onChange={(year) => updateAppContext({ currentYear: year })}
          />
          <IdFilter
            label={Locales.t('carId')}
            ids={auth.carIds}
            value={appContext.currentCarId}
            onChange={(id) => updateAppContext({ currentCarId: id })}
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
          title={carExpenseTitle(expense)}
          description={summaryLine(
            formatDate(expense.invoiceDate),
            formatMoney(expense.total),
            carExpenseTypeLabel(expense),
          )}
          icon="car"
          onPress={() => router.push(detailsRoute('car-expense', expense.id))}
          onEdit={() => router.push(formRoute('car-expense', expense.id))}
          onDelete={() =>
            deleteEntry.mutateAsync({
              id: expense.id,
              invoiceDate: expense.invoiceDate,
            })
          }
        />
      )}
      onCreate={
        auth.carIds.length
          ? () => router.push(formRoute('car-expense'))
          : undefined
      }
    />
  )
}

export default CarExpensesPage
