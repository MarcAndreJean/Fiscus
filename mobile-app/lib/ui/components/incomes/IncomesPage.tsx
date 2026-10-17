import { router } from 'expo-router'
import React from 'react'

import { useDeleteIncome, useIncomes } from '../../../api/incomes'
import { useAppContext } from '../../../context'
import { Locales } from '../../../locales'
import { detailsRoute, formRoute } from '../../../navigation'
import { useAuth } from '../../../settings'
import { formatDate, formatMoney, summaryLine } from '../../../utils/format'
import EntityListItem from '../shared/EntityListItem'
import EntityListPage from '../shared/EntityListPage'
import { IdFilter, YearFilter } from '../shared/ListFilters'

const IncomesPage = () => {
  const auth = useAuth()
  const { appContext, updateAppContext } = useAppContext()
  const query = useIncomes({
    businessId: appContext.currentBusinessId,
    year: appContext.currentYear,
  })
  const deleteIncome = useDeleteIncome()

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
      keyOf={(income) => income.id}
      renderItem={(income) => (
        <EntityListItem
          title={
            income.clientName || income.description || Locales.t('titleIncomes')
          }
          description={summaryLine(
            formatDate(income.invoiceDate),
            formatMoney(income.total),
            income.clientName ? income.description : null,
          )}
          icon="currency-usd"
          onPress={() => router.push(detailsRoute('income', income.id))}
          onEdit={() => router.push(formRoute('income', income.id))}
          onDelete={() =>
            deleteIncome.mutateAsync({
              id: income.id,
              invoiceDate: income.invoiceDate,
            })
          }
        />
      )}
      onCreate={
        auth.businessIds.length
          ? () => router.push(formRoute('income'))
          : undefined
      }
    />
  )
}

export default IncomesPage
