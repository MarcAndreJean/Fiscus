import { useLocalSearchParams } from 'expo-router'
import React from 'react'

import {
  EntityNotFound,
  LoadingIndicator,
  TravelLogForm,
  useCachedTravelLog,
  useAuth,
} from '@/lib'

/** Create (no id) or edit (?id=...) form. */
const TravelLogFormScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { isLoading } = useAuth()
  const existing = useCachedTravelLog(id)

  if (isLoading) return <LoadingIndicator />
  if (id && !existing) return <EntityNotFound />
  return <TravelLogForm existing={existing} />
}

export default TravelLogFormScreen
