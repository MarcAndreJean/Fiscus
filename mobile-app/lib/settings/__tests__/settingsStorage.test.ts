import { describe, expect, it } from '@jest/globals'

import { DEFAULT_API_URL } from '../../config'
import {
  connectionChanged,
  DEFAULT_SETTINGS,
  mergeStoredSettings,
  normalizeApiUrl,
  parseBool,
  parseList,
  settingsFromEnv,
  startingApiUrl,
} from '../settingsStorage'

describe('normalizeApiUrl', () => {
  it('trims spaces and trailing slashes', () => {
    expect(normalizeApiUrl('  https://abc.example.com/prod//  ')).toBe(
      'https://abc.example.com/prod',
    )
  })

  it.each([undefined, '', '  '])('reads %p as no URL', (value) => {
    expect(normalizeApiUrl(value)).toBe('')
  })
})

describe('connectionChanged', () => {
  it.each(['apiUrl', 'apiKey', 'userId'] as const)(
    'is true when %s changes',
    (field) => {
      expect(
        connectionChanged(DEFAULT_SETTINGS, {
          ...DEFAULT_SETTINGS,
          [field]: 'new',
        }),
      ).toBe(true)
    },
  )

  it('is false for appearance and owner ids', () => {
    expect(
      connectionChanged(DEFAULT_SETTINGS, {
        ...DEFAULT_SETTINGS,
        theme: 'dark',
        businessIds: ['b1'],
        hasTps: true,
      }),
    ).toBe(false)
  })
})

describe('startingApiUrl', () => {
  it('uses EXPO_PUBLIC_API_URL when it is set', () => {
    expect(startingApiUrl(' https://env.example.com/prod/ ')).toBe(
      'https://env.example.com/prod',
    )
  })

  it('falls back to DEFAULT_API_URL otherwise', () => {
    expect(startingApiUrl(undefined)).toBe(DEFAULT_API_URL)
  })
})

describe('parseList', () => {
  it('trims ids and drops empty entries', () => {
    expect(parseList(' a, b ,,c, ')).toEqual(['a', 'b', 'c'])
  })

  it.each([undefined, '', ' , '])('reads %p as an empty list', (value) => {
    expect(parseList(value)).toEqual([])
  })
})

describe('parseBool', () => {
  it.each(['true', 'TRUE', '1', 'yes'])('reads %p as true', (value) => {
    expect(parseBool(value)).toBe(true)
  })

  it.each(['false', '0', 'no', '', undefined])('reads %p as false', (value) => {
    expect(parseBool(value)).toBe(false)
  })
})

describe('mergeStoredSettings', () => {
  it('fills missing fields from the defaults', () => {
    expect(mergeStoredSettings('{"userId":"u"}')).toEqual({
      ...DEFAULT_SETTINGS,
      userId: 'u',
    })
  })

  it.each(['{bad', null, '42'])('falls back to the defaults for %p', (json) => {
    expect(mergeStoredSettings(json)).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps a stored API URL, cleaned', () => {
    expect(
      mergeStoredSettings('{"apiUrl":" https://abc.example.com/prod/ "}')
        .apiUrl,
    ).toBe('https://abc.example.com/prod')
  })

  it.each(['{}', '{"apiUrl":""}', '{"apiUrl":42}'])(
    'uses the starting URL when %p has none',
    (json) => {
      const starting = 'https://starting.example.com/prod'
      expect(mergeStoredSettings(json, starting).apiUrl).toBe(starting)
    },
  )
})

describe('settingsFromEnv', () => {
  it('reads the EXPO_PUBLIC_ variables', () => {
    expect(
      settingsFromEnv({
        EXPO_PUBLIC_API_URL: 'https://abc.example.com/prod/',
        EXPO_PUBLIC_SECRET_KEY: 'key',
        EXPO_PUBLIC_USER_ID: 'u',
        EXPO_PUBLIC_CAR_IDS: 'c1, c2',
        EXPO_PUBLIC_HAS_TPS: 'false',
        EXPO_PUBLIC_HAS_TVQ: 'true',
      }),
    ).toEqual({
      ...DEFAULT_SETTINGS,
      apiUrl: 'https://abc.example.com/prod',
      apiKey: 'key',
      userId: 'u',
      businessIds: [],
      carIds: ['c1', 'c2'],
      houseIds: [],
      hasTps: false,
      hasTvq: true,
    })
  })
})

describe('mergeStoredSettings cleanup', () => {
  it('drops blank ids and reads comma-separated text', () => {
    const merged = mergeStoredSettings(
      '{"businessIds":["a",""," b "],"carIds":[""],"houseIds":"h1, h2"}',
    )
    expect(merged.businessIds).toEqual(['a', 'b'])
    expect(merged.carIds).toEqual([])
    expect(merged.houseIds).toEqual(['h1', 'h2'])
  })
})
