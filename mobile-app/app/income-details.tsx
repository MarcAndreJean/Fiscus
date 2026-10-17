import { router, useLocalSearchParams } from 'expo-router'
import React from 'react'

import {
  DetailsScreen,
  EntityViewer,
  formRoute,
  incomeFields,
  Locales,
  useCachedIncome,
  useDeleteIncome,
} from '@/lib'

const IncomeDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const income = useCachedIncome(id)
  const deleteIncome = useDeleteIncome()

  return (
    <DetailsScreen found={!!income}>
      {income && (
        <EntityViewer
          id={income.id}
          title={income.clientName || Locales.t('titleIncomes')}
          icon="currency-usd"
          fields={incomeFields(income)}
          images={income.images}
          files={income.files}
          onEdit={() => router.push(formRoute('income', income.id))}
          onDelete={() =>
            deleteIncome.mutateAsync({
              id: income.id,
              invoiceDate: income.invoiceDate,
            })
          }
        />
      )}
    </DetailsScreen>
  )
}

export default IncomeDetails
