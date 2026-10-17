import { router, useLocalSearchParams } from 'expo-router'
import React from 'react'

import {
  DetailsScreen,
  EntityViewer,
  formRoute,
  expenseFields,
  expenseTitle,
  useCachedExpense,
  useDeleteExpense,
} from '@/lib'

const ExpenseDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const expense = useCachedExpense(id)
  const deleteExpense = useDeleteExpense()

  return (
    <DetailsScreen found={!!expense}>
      {expense && (
        <EntityViewer
          id={expense.id}
          title={expenseTitle(expense)}
          icon="receipt"
          fields={expenseFields(expense)}
          images={expense.images}
          files={expense.files}
          onEdit={() => router.push(formRoute('expense', expense.id))}
          onDelete={() =>
            deleteExpense.mutateAsync({
              id: expense.id,
              invoiceDate: expense.invoiceDate,
            })
          }
        />
      )}
    </DetailsScreen>
  )
}

export default ExpenseDetails
