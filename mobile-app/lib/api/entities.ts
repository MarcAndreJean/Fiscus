import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useCallback, useRef, useSyncExternalStore } from 'react'

import { type QueryParams, useApiClient } from './client'
import { queryKeys, type Resource } from './queryKeys'
import { parseJsonList } from '../utils/files'

export type RawEntity = Record<string, unknown>

/** The API stores images/files as JSON text; the app works with arrays. */
export const parseAttachments = <T>(raw: RawEntity): T =>
  ({
    ...raw,
    images: parseJsonList(raw.images),
    files: parseJsonList(raw.files),
  }) as T

/** A list of one resource, parsed once when it arrives. */
export function useEntityList<T>(
  resource: Resource,
  params: QueryParams,
  options: { enabled: boolean; parse: (raw: RawEntity) => T },
) {
  const api = useApiClient()
  const { parse } = options
  return useQuery({
    queryKey: queryKeys.list(resource, params),
    queryFn: async () =>
      (await api.get<RawEntity[]>(`/${resource}`, params)).map(parse),
    enabled: options.enabled,
  })
}

export const invalidateEntity = (client: QueryClient, resource: Resource) =>
  client.invalidateQueries({ queryKey: queryKeys.all(resource) })

function useEntityMutation<TModel, TData>(
  resource: Resource,
  send: (api: ReturnType<typeof useApiClient>, model: TModel) => Promise<TData>,
  onSaved?: (client: QueryClient, data: TData) => void,
) {
  const api = useApiClient()
  const client = useQueryClient()
  return useMutation({
    mutationFn: (model: TModel) => send(api, model),
    onSuccess: (data) => {
      onSaved?.(client, data)
      // Refresh the lists in the background: the caller can close its screen right away.
      invalidateEntity(client, resource)
    },
  })
}

export const useCreateEntity = <TModel, TData = unknown>(resource: Resource) =>
  useEntityMutation<TModel, TData>(resource, (api, model) =>
    api.post<TData>(`/${resource}`, model),
  )

/** Saves an edit and puts the saved version in the cache right away (details screens). */
export const useUpdateEntity = <TModel, T extends { id: string }>(
  resource: Resource,
  parse: (raw: RawEntity) => T,
) =>
  useEntityMutation<TModel, RawEntity>(
    resource,
    (api, model) => api.put<RawEntity>(`/${resource}`, model),
    (client, data) => replaceCachedEntity(client, resource, parse(data)),
  )

export const useDeleteEntity = <TModel>(resource: Resource) =>
  useEntityMutation<TModel, string>(resource, (api, model) =>
    api.delete<string>(`/${resource}`, model),
  )

/** Replaces the entity in every cached list of the resource that holds it. */
export function replaceCachedEntity<T extends { id: string }>(
  client: QueryClient,
  resource: Resource,
  entity: T,
) {
  client.setQueriesData<T[]>({ queryKey: queryKeys.all(resource) }, (items) =>
    items?.some((item) => item.id === entity.id)
      ? items.map((item) => (item.id === entity.id ? entity : item))
      : items,
  )
}

/**
 * An entity from the resource's cached lists. When several lists hold it (a travel log in
 * "All" and in a filtered list), the most recently fetched copy wins.
 */
export function findCachedEntity<T extends { id: string }>(
  client: QueryClient,
  resource: Resource,
  id: string,
): T | undefined {
  const queries = client
    .getQueryCache()
    .findAll({ queryKey: queryKeys.all(resource) })
    .sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt)
  for (const query of queries) {
    const found = (query.state.data as T[] | undefined)?.find(
      (item) => item.id === id,
    )
    if (found) return found
  }
  return undefined
}

/**
 * The entity a details or edit screen shows. It follows the cache, so an edit or a list
 * refresh shows up at once; after a delete it keeps the last version instead of flashing
 * "not found" while the screen closes.
 */
export function useCachedEntity<T extends { id: string }>(
  resource: Resource,
  id: string | undefined,
): T | undefined {
  const client = useQueryClient()
  const cache = client.getQueryCache()
  const subscribe = useCallback(
    (onChange: () => void) => cache.subscribe(onChange),
    [cache],
  )
  const found = useSyncExternalStore(subscribe, () =>
    id ? findCachedEntity<T>(client, resource, id) : undefined,
  )
  const last = useRef<T | undefined>(undefined)
  if (found) last.current = found
  return found ?? (last.current?.id === id ? last.current : undefined)
}
