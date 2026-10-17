import {
  parseAttachments,
  type RawEntity,
  useCachedEntity,
  useDeleteEntity,
  useEntityList,
} from './entities'
import { useAuth } from '../settings'
import type { CarExpenseData, DeleteCarExpenseModel } from '../types'

const RESOURCE = 'car-expenses'

export const parseCarExpense = (raw: RawEntity) =>
  parseAttachments<CarExpenseData>(raw)

export function useCarExpenses(filters: {
  carId: string
  year: number
  month?: number | null
}) {
  const auth = useAuth()
  return useEntityList(RESOURCE, filters, {
    enabled: !auth.isLoading && !!filters.carId && !!filters.year,
    parse: parseCarExpense,
  })
}

// Created and updated by the form shared with business and house expenses (see EXPENSE_KINDS).
export const useDeleteCarExpense = () =>
  useDeleteEntity<DeleteCarExpenseModel>(RESOURCE)
export const useCachedCarExpense = (id?: string) =>
  useCachedEntity<CarExpenseData>(RESOURCE, id)
