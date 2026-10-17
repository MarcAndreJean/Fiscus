import { useLocalSearchParams } from 'expo-router'
import React from 'react'

import {
  EntityNotFound,
  LoadingIndicator,
  MiscFileForm,
  useCachedMiscFile,
  useAuth,
} from '@/lib'

/** Create (no id) or edit (?id=...) form. */
const MiscFileFormScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { isLoading } = useAuth()
  const existing = useCachedMiscFile(id)

  if (isLoading) return <LoadingIndicator />
  if (id && !existing) return <EntityNotFound />
  return <MiscFileForm existing={existing} />
}

export default MiscFileFormScreen
