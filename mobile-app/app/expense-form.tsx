import { useLocalSearchParams } from 'expo-router'
import React from 'react'

import {
  EntityNotFound,
  ExpenseForm,
  LoadingIndicator,
  useCachedExpense,
  useAuth,
} from '@/lib'

/** Create (no id) or edit (?id=...) form. */
const ExpenseFormScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { isLoading } = useAuth()
  const existing = useCachedExpense(id)

  if (isLoading) return <LoadingIndicator />
  if (id && !existing) return <EntityNotFound />
  return <ExpenseForm kind="expense" existing={existing} />
}

export default ExpenseFormScreen
