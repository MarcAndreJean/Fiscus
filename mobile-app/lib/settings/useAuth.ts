import { useMemo } from 'react'

import { useSettings } from './SettingsProvider'
import type { Setting } from '../types'

export type AuthSettings = Pick<
  Setting,
  | 'apiUrl'
  | 'apiKey'
  | 'userId'
  | 'businessIds'
  | 'carIds'
  | 'houseIds'
  | 'hasTps'
  | 'hasTvq'
>

/** The API address, credentials and owner ids from the settings, loaded once for the whole app. */
export function useAuth(): AuthSettings & { isLoading: boolean } {
  const { settings, isLoading } = useSettings()
  return useMemo(
    () => ({
      apiUrl: settings.apiUrl,
      apiKey: settings.apiKey,
      userId: settings.userId,
      businessIds: settings.businessIds,
      carIds: settings.carIds,
      houseIds: settings.houseIds,
      hasTps: settings.hasTps,
      hasTvq: settings.hasTvq,
      isLoading,
    }),
    [settings, isLoading],
  )
}
