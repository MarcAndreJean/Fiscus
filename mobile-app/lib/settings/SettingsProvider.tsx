import { useQueryClient } from '@tanstack/react-query'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  connectionChanged,
  DEFAULT_SETTINGS,
  loadSettings,
  persistSettings,
} from './settingsStorage'
import type { Setting } from '../types'

type SettingsContextValue = {
  settings: Setting
  isLoading: boolean
  /** Applies the new settings right away and stores them on the device. */
  saveSettings: (next: Setting) => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Setting>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    loadSettings()
      .catch((error: unknown) => {
        console.error('Could not load settings:', error)
        return DEFAULT_SETTINGS
      })
      .then((loaded) => {
        if (!active) return
        setSettings(loaded)
        setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const queryClient = useQueryClient()

  const saveSettings = useCallback(
    async (next: Setting) => {
      // Lists cached from the previous API or account must not show as this one's.
      // The queries are refetched with the new settings when the screens re-render.
      if (connectionChanged(settings, next)) queryClient.clear()
      setSettings(next)
      await persistSettings(next)
    },
    [settings, queryClient],
  )

  const value = useMemo(
    () => ({ settings, isLoading, saveSettings }),
    [settings, isLoading, saveSettings],
  )

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext)
  if (!value) {
    throw new Error('useSettings must be used inside <SettingsProvider>')
  }
  return value
}
