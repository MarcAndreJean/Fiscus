import axios from 'axios'
import { useMemo } from 'react'

import { Locales } from '../locales'
import { useAuth } from '../settings'
import type { ResponseBody } from '../types'

/** The API answered, but with an error status in its body (400, 404, 500). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export type QueryParams = Record<string, string | number | null | undefined>

/** Drops null, undefined and empty values so they are not sent as "null" or "". */
export const cleanParams = (
  params: QueryParams,
): Record<string, string | number> =>
  Object.fromEntries(
    Object.entries(params).filter(
      (entry): entry is [string, string | number] =>
        entry[1] !== null && entry[1] !== undefined && entry[1] !== '',
    ),
  )

/** API Gateway always answers HTTP 200; the real status is in the body. */
export function unwrap<T>(body: ResponseBody<T>): T {
  if (body.statusCode === 200) return body.data
  throw new ApiError(
    body.message || Locales.t('requestFailed', { status: body.statusCode }),
    body.statusCode,
  )
}

export type ApiClient = {
  get<T>(path: string, params?: QueryParams): Promise<T>
  post<T>(path: string, body: unknown): Promise<T>
  put<T>(path: string, body: unknown): Promise<T>
  delete<T>(path: string, body: unknown): Promise<T>
}

export function createApiClient(apiUrl: string, apiKey: string): ApiClient {
  const http = axios.create({
    baseURL: apiUrl,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
  })
  // Without a URL axios would call a relative path and fail with a vague "Network Error".
  http.interceptors.request.use((config) => {
    if (!apiUrl) throw new Error(Locales.t('apiUrlMissing'))
    return config
  })
  return {
    get: async <T>(path: string, params: QueryParams = {}) =>
      unwrap(
        (await http.get<ResponseBody<T>>(path, { params: cleanParams(params) }))
          .data,
      ),
    post: async <T>(path: string, body: unknown) =>
      unwrap((await http.post<ResponseBody<T>>(path, body)).data),
    put: async <T>(path: string, body: unknown) =>
      unwrap((await http.put<ResponseBody<T>>(path, body)).data),
    delete: async <T>(path: string, body: unknown) =>
      unwrap((await http.delete<ResponseBody<T>>(path, { data: body })).data),
  }
}

export function useApiClient(): ApiClient {
  const { apiUrl, apiKey } = useAuth()
  return useMemo(() => createApiClient(apiUrl, apiKey), [apiUrl, apiKey])
}

/** A message that can be shown to the user for any thrown value. */
export const errorMessage = (error: unknown): string =>
  error instanceof Error && error.message
    ? error.message
    : Locales.t('unknownError')

/** The /files/{s3key+} path, with each part of the key URL-encoded. */
export const filePath = (s3key: string): string =>
  `/files/${s3key.split('/').map(encodeURIComponent).join('/')}`
