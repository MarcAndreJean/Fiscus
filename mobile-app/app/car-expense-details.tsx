import { router, useLocalSearchParams } from 'expo-router'
import React from 'react'

import {
  DetailsScreen,
  EntityViewer,
  formRoute,
  carExpenseFields,
  carExpenseTitle,
  useCachedCarExpense,
  useDeleteCarExpense,
} from '@/lib'

const CarExpenseDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const carExpense = useCachedCarExpense(id)
  const deleteCarExpense = useDeleteCarExpense()

  return (
    <DetailsScreen found={!!carExpense}>
      {carExpense && (
        <EntityViewer
          id={carExpense.id}
          title={carExpenseTitle(carExpense)}
          icon="car"
          fields={carExpenseFields(carExpense)}
          images={carExpense.images}
          files={carExpense.files}
          onEdit={() => router.push(formRoute('car-expense', carExpense.id))}
          onDelete={() =>
            deleteCarExpense.mutateAsync({
              id: carExpense.id,
              invoiceDate: carExpense.invoiceDate,
            })
          }
        />
      )}
    </DetailsScreen>
  )
}

export default CarExpenseDetails
