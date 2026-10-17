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
  CreateMiscFileModel,
  DeleteMiscFileModel,
  MiscFileData,
  UpdateMiscFileModel,
} from '../types'

const RESOURCE = 'misc-files'

export const parseMiscFile = (raw: RawEntity) =>
  parseAttachments<MiscFileData>(raw)

export function useMiscFiles(filters: { year: number; month?: number | null }) {
  const auth = useAuth()
  return useEntityList(
    RESOURCE,
    { userId: auth.userId, ...filters },
    {
      enabled: !auth.isLoading && !!auth.userId && !!filters.year,
      parse: parseMiscFile,
    },
  )
}

export const useCreateMiscFile = () =>
  useCreateEntity<CreateMiscFileModel, MiscFileData>(RESOURCE)
export const useUpdateMiscFile = () =>
  useUpdateEntity<UpdateMiscFileModel, MiscFileData>(RESOURCE, parseMiscFile)
export const useDeleteMiscFile = () =>
  useDeleteEntity<DeleteMiscFileModel>(RESOURCE)
export const useCachedMiscFile = (id?: string) =>
  useCachedEntity<MiscFileData>(RESOURCE, id)
