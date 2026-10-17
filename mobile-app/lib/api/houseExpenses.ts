import {
  parseAttachments,
  type RawEntity,
  useCachedEntity,
  useDeleteEntity,
  useEntityList,
} from './entities'
import { useAuth } from '../settings'
import type { DeleteHouseExpenseModel, HouseExpenseData } from '../types'

const RESOURCE = 'house-expenses'

export const parseHouseExpense = (raw: RawEntity) =>
  parseAttachments<HouseExpenseData>(raw)

export function useHouseExpenses(filters: {
  houseId: string
  year: number
  month?: number | null
}) {
  const auth = useAuth()
  return useEntityList(RESOURCE, filters, {
    enabled: !auth.isLoading && !!filters.houseId && !!filters.year,
    parse: parseHouseExpense,
  })
}

// Created and updated by the form shared with business and car expenses (see EXPENSE_KINDS).
export const useDeleteHouseExpense = () =>
  useDeleteEntity<DeleteHouseExpenseModel>(RESOURCE)
export const useCachedHouseExpense = (id?: string) =>
  useCachedEntity<HouseExpenseData>(RESOURCE, id)
