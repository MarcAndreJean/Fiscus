import {
  parseAttachments,
  type RawEntity,
  useCachedEntity,
  useCreateEntity,
  useDeleteEntity,
  useEntityList,
  useUpdateEntity,
} from './entities'
import { useAuth } from '../settings'
import type {
  CreateTravelLogModel,
  DeleteTravelLogModel,
  TravelLogData,
  UpdateTravelLogModel,
} from '../types'

const RESOURCE = 'travel-logs'

export const parseTravelLog = (raw: RawEntity) =>
  parseAttachments<TravelLogData>(raw)

export function useTravelLogs(filters: {
  year: number
  month?: number | null
  businessId?: string | null
  carId?: string | null
}) {
  const auth = useAuth()
  return useEntityList(
    RESOURCE,
    { userId: auth.userId, ...filters },
    {
      enabled: !auth.isLoading && !!auth.userId && !!filters.year,
      parse: parseTravelLog,
    },
  )
}

export const useCreateTravelLog = () =>
  useCreateEntity<CreateTravelLogModel, TravelLogData>(RESOURCE)
export const useUpdateTravelLog = () =>
  useUpdateEntity<UpdateTravelLogModel, TravelLogData>(RESOURCE, parseTravelLog)
export const useDeleteTravelLog = () =>
  useDeleteEntity<DeleteTravelLogModel>(RESOURCE)
export const useCachedTravelLog = (id?: string) =>
  useCachedEntity<TravelLogData>(RESOURCE, id)
