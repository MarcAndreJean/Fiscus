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
  CreateIncomeModel,
  DeleteIncomeModel,
  IncomeData,
  IncomeItemModel,
  UpdateIncomeModel,
} from '../types'
import { parseJsonList } from '../utils/files'

const RESOURCE = 'incomes'

export const parseIncome = (raw: RawEntity): IncomeData => ({
  ...parseAttachments<IncomeData>(raw),
  items: parseJsonList<IncomeItemModel>(raw.items),
})

export function useIncomes(filters: {
  businessId: string
  year: number
  month?: number | null
}) {
  const auth = useAuth()
  return useEntityList(
    RESOURCE,
    { userId: auth.userId, ...filters },
    {
      enabled:
        !auth.isLoading &&
        !!auth.userId &&
        !!filters.businessId &&
        !!filters.year,
      parse: parseIncome,
    },
  )
}

export const useCreateIncome = () =>
  useCreateEntity<CreateIncomeModel, IncomeData>(RESOURCE)
export const useUpdateIncome = () =>
  useUpdateEntity<UpdateIncomeModel, IncomeData>(RESOURCE, parseIncome)
export const useDeleteIncome = () =>
  useDeleteEntity<DeleteIncomeModel>(RESOURCE)
export const useCachedIncome = (id?: string) =>
  useCachedEntity<IncomeData>(RESOURCE, id)
