import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

import { DEFAULT_API_URL } from '../config'
import type { Setting } from '../types'

const SETTINGS_KEY = 'settings'

/** " https://x/prod/ " → "https://x/prod"; nothing gives "". */
export const normalizeApiUrl = (value: string | undefined): string =>
  (value ?? '').trim().replace(/\/+$/, '')

/** The API URL the app starts with: EXPO_PUBLIC_API_URL, else DEFAULT_API_URL. */
export const startingApiUrl = (envUrl: string | undefined): string =>
  normalizeApiUrl(envUrl) || normalizeApiUrl(DEFAULT_API_URL)

const STARTING_API_URL = startingApiUrl(process.env.EXPO_PUBLIC_API_URL)

export const DEFAULT_SETTINGS: Setting = {
  theme: 'auto',
  color: 'default',
  apiUrl: STARTING_API_URL,
  apiKey: '',
  userId: '',
  businessIds: [],
  carIds: [],
  houseIds: [],
  hasTps: false,
  hasTvq: false,
}

/** True when the new settings talk to another API or account, so cached data is not theirs. */
export const connectionChanged = (before: Setting, after: Setting): boolean =>
  before.apiUrl !== after.apiUrl ||
  before.apiKey !== after.apiKey ||
  before.userId !== after.userId

export const parseBool = (value: string | undefined): boolean =>
  ['true', '1', 'yes'].includes((value ?? '').trim().toLowerCase())

/** "a, b,,c" → ["a", "b", "c"] */
export const parseList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

export const settingsFromEnv = (
  env: Record<string, string | undefined>,
): Setting => ({
  ...DEFAULT_SETTINGS,
  apiUrl: startingApiUrl(env.EXPO_PUBLIC_API_URL),
  apiKey: env.EXPO_PUBLIC_SECRET_KEY ?? '',
  userId: env.EXPO_PUBLIC_USER_ID ?? '',
  businessIds: parseList(env.EXPO_PUBLIC_BUSINESS_IDS),
  carIds: parseList(env.EXPO_PUBLIC_CAR_IDS),
  houseIds: parseList(env.EXPO_PUBLIC_HOUSE_IDS),
  hasTps: parseBool(env.EXPO_PUBLIC_HAS_TPS),
  hasTvq: parseBool(env.EXPO_PUBLIC_HAS_TVQ),
})

/** Stored ids as a clean list: accepts a list (maybe with blanks) or comma-separated text. */
const cleanIds = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map((id) => String(id).trim()).filter(Boolean)
    : typeof value === 'string'
      ? parseList(value)
      : []

/**
 * Stored settings over the defaults; anything unreadable gives the defaults. A missing or
 * empty stored API URL falls back to the starting URL.
 */
export const mergeStoredSettings = (
  json: string | null,
  fallbackApiUrl: string = STARTING_API_URL,
): Setting => {
  const defaults = { ...DEFAULT_SETTINGS, apiUrl: fallbackApiUrl }
  if (!json) return defaults
  try {
    const stored: unknown = JSON.parse(json)
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
      return defaults
    }
    const merged = { ...defaults, ...stored } as Setting
    const storedUrl =
      typeof merged.apiUrl === 'string' ? normalizeApiUrl(merged.apiUrl) : ''
    return {
      ...merged,
      apiUrl: storedUrl || fallbackApiUrl,
      businessIds: cleanIds(merged.businessIds),
      carIds: cleanIds(merged.carIds),
      houseIds: cleanIds(merged.houseIds),
    }
  } catch {
    return defaults
  }
}

// Expo only inlines EXPO_PUBLIC_* variables written out literally like this.
const publicEnv = (): Record<string, string | undefined> => ({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_SECRET_KEY: process.env.EXPO_PUBLIC_SECRET_KEY,
  EXPO_PUBLIC_USER_ID: process.env.EXPO_PUBLIC_USER_ID,
  EXPO_PUBLIC_BUSINESS_IDS: process.env.EXPO_PUBLIC_BUSINESS_IDS,
  EXPO_PUBLIC_CAR_IDS: process.env.EXPO_PUBLIC_CAR_IDS,
  EXPO_PUBLIC_HOUSE_IDS: process.env.EXPO_PUBLIC_HOUSE_IDS,
  EXPO_PUBLIC_HAS_TPS: process.env.EXPO_PUBLIC_HAS_TPS,
  EXPO_PUBLIC_HAS_TVQ: process.env.EXPO_PUBLIC_HAS_TVQ,
})

/** On the web there is no secure store: settings come from the .env file. */
export const loadSettings = async (): Promise<Setting> =>
  Platform.OS === 'web'
    ? settingsFromEnv(publicEnv())
    : mergeStoredSettings(await SecureStore.getItemAsync(SETTINGS_KEY))

export const persistSettings = async (settings: Setting): Promise<void> => {
  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(settings))
  }
}
