import {
  parseAttachments,
  type RawEntity,
  useCachedEntity,
  useDeleteEntity,
  useEntityList,
} from './entities'
import { useAuth } from '../settings'
import type { DeleteExpenseModel, ExpenseData } from '../types'

const RESOURCE = 'expenses'

export const parseExpense = (raw: RawEntity) =>
  parseAttachments<ExpenseData>(raw)

export function useExpenses(filters: {
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
      parse: parseExpense,
    },
  )
}

// Created and updated by the form shared with car and house expenses (see EXPENSE_KINDS).
export const useDeleteExpense = () =>
  useDeleteEntity<DeleteExpenseModel>(RESOURCE)
export const useCachedExpense = (id?: string) =>
  useCachedEntity<ExpenseData>(RESOURCE, id)
