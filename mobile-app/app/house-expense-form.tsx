import { useLocalSearchParams } from 'expo-router'
import React from 'react'

import {
  EntityNotFound,
  ExpenseForm,
  LoadingIndicator,
  useCachedHouseExpense,
  useAuth,
} from '@/lib'

/** Create (no id) or edit (?id=...) form. */
const HouseExpenseFormScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { isLoading } = useAuth()
  const existing = useCachedHouseExpense(id)

  if (isLoading) return <LoadingIndicator />
  if (id && !existing) return <EntityNotFound />
  return <ExpenseForm kind="house-expense" existing={existing} />
}

export default HouseExpenseFormScreen
