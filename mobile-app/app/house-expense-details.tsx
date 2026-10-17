import { router, useLocalSearchParams } from 'expo-router'
import React from 'react'

import {
  DetailsScreen,
  EntityViewer,
  formRoute,
  houseExpenseFields,
  houseExpenseTitle,
  useCachedHouseExpense,
  useDeleteHouseExpense,
} from '@/lib'

const HouseExpenseDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const houseExpense = useCachedHouseExpense(id)
  const deleteHouseExpense = useDeleteHouseExpense()

  return (
    <DetailsScreen found={!!houseExpense}>
      {houseExpense && (
        <EntityViewer
          id={houseExpense.id}
          title={houseExpenseTitle(houseExpense)}
          icon="home"
          fields={houseExpenseFields(houseExpense)}
          images={houseExpense.images}
          files={houseExpense.files}
          onEdit={() =>
            router.push(formRoute('house-expense', houseExpense.id))
          }
          onDelete={() =>
            deleteHouseExpense.mutateAsync({
              id: houseExpense.id,
              invoiceDate: houseExpense.invoiceDate,
            })
          }
        />
      )}
    </DetailsScreen>
  )
}

export default HouseExpenseDetails
