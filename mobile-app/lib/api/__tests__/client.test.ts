import { describe, expect, it } from '@jest/globals'

import {
  ApiError,
  cleanParams,
  createApiClient,
  errorMessage,
  filePath,
  unwrap,
} from '../client'

describe('createApiClient', () => {
  it('asks for the API URL instead of calling a relative path', async () => {
    await expect(createApiClient('', 'key').get('/expenses')).rejects.toThrow(
      'Set the API URL in Settings first.',
    )
  })
})

describe('unwrap', () => {
  it('returns the data of a successful response', () => {
    expect(unwrap({ statusCode: 200, message: 'ok', data: [1, 2] })).toEqual([
      1, 2,
    ])
  })

  it('throws an ApiError carrying the status and message', () => {
    const failing = () =>
      unwrap({ statusCode: 404, message: 'Expense not found', data: null })
    expect(failing).toThrow(ApiError)
    expect(failing).toThrow('Expense not found')
    try {
      failing()
    } catch (error) {
      expect((error as ApiError).statusCode).toBe(404)
    }
  })
})

describe('cleanParams', () => {
  it('drops empty values and keeps the rest', () => {
    expect(
      cleanParams({ a: 1, b: null, c: '', d: undefined, e: 'x', f: 0 }),
    ).toEqual({ a: 1, e: 'x', f: 0 })
  })
})

describe('errorMessage', () => {
  it('uses the message of an error', () => {
    expect(
      errorMessage(new ApiError('Missing required field(s): reason', 400)),
    ).toBe('Missing required field(s): reason')
  })

  it('has a readable fallback for anything else', () => {
    expect(errorMessage({})).toBe('Something went wrong. Please try again.')
  })
})

describe('filePath', () => {
  it('encodes each part of an S3 key but keeps the slashes', () => {
    expect(filePath('2025/invoice/u-my biz/a#1.png')).toBe(
      '/files/2025/invoice/u-my%20biz/a%231.png',
    )
  })
})
