import { useLocalSearchParams } from 'expo-router'
import React from 'react'

import {
  EntityNotFound,
  LoadingIndicator,
  IncomeForm,
  useCachedIncome,
  useAuth,
} from '@/lib'

/** Create (no id) or edit (?id=...) form. */
const IncomeFormScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { isLoading } = useAuth()
  const existing = useCachedIncome(id)

  if (isLoading) return <LoadingIndicator />
  if (id && !existing) return <EntityNotFound />
  return <IncomeForm existing={existing} />
}

export default IncomeFormScreen
