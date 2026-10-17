import { router } from 'expo-router'
import React from 'react'

import { expenseTitle, expenseTypeLabel } from './expenseFields'
import { useDeleteExpense, useExpenses } from '../../../api/expenses'
import { useAppContext } from '../../../context'
import { Locales } from '../../../locales'
import { detailsRoute, formRoute } from '../../../navigation'
import { useAuth } from '../../../settings'
import { formatDate, formatMoney, summaryLine } from '../../../utils/format'
import EntityListItem from '../shared/EntityListItem'
import EntityListPage from '../shared/EntityListPage'
import { IdFilter, YearFilter } from '../shared/ListFilters'

const ExpensesPage = () => {
  const auth = useAuth()
  const { appContext, updateAppContext } = useAppContext()
  const query = useExpenses({
    businessId: appContext.currentBusinessId,
    year: appContext.currentYear,
  })
  const deleteExpense = useDeleteExpense()

  return (
    <EntityListPage
      filters={
        <>
          <YearFilter
            value={appContext.currentYear}
            onChange={(year) => updateAppContext({ currentYear: year })}
          />
          <IdFilter
            label={Locales.t('businessId')}
            ids={auth.businessIds}
            value={appContext.currentBusinessId}
            onChange={(id) => updateAppContext({ currentBusinessId: id })}
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
          title={expenseTitle(expense)}
          description={summaryLine(
            formatDate(expense.invoiceDate),
            formatMoney(expense.total),
            expenseTypeLabel(expense),
          )}
          icon="receipt"
          onPress={() => router.push(detailsRoute('expense', expense.id))}
          onEdit={() => router.push(formRoute('expense', expense.id))}
          onDelete={() =>
            deleteExpense.mutateAsync({
              id: expense.id,
              invoiceDate: expense.invoiceDate,
            })
          }
        />
      )}
      onCreate={
        auth.businessIds.length
          ? () => router.push(formRoute('expense'))
          : undefined
      }
    />
  )
}

export default ExpensesPage
