import { useLocalSearchParams } from 'expo-router'
import React from 'react'

import {
  EntityNotFound,
  ExpenseForm,
  LoadingIndicator,
  useCachedCarExpense,
  useAuth,
} from '@/lib'

/** Create (no id) or edit (?id=...) form. */
const CarExpenseFormScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { isLoading } = useAuth()
  const existing = useCachedCarExpense(id)

  if (isLoading) return <LoadingIndicator />
  if (id && !existing) return <EntityNotFound />
  return <ExpenseForm kind="car-expense" existing={existing} />
}

export default CarExpenseFormScreen
