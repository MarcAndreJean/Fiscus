import { EXPENSE_KINDS, type ExpenseKind } from './expenseKinds'
import type {
  Attachments,
  CarExpenseData,
  CarExpenseType,
  CreateCarExpenseModel,
  CreateExpenseModel,
  CreateHouseExpenseModel,
  ExpenseData,
  HouseExpenseData,
  HouseExpenseType,
  TaxedAmounts,
  UpdateCarExpenseModel,
  UpdateExpenseModel,
  UpdateHouseExpenseModel,
} from '../../../types'
import { ExpenseType } from '../../../types'
import {
  AmountType,
  type AmountState,
  amountFromEntity,
  emptyAmount,
} from '../../../utils/amount'
import { mergeAttachments } from '../../../utils/files'
import {
  keepDateIfUnchanged,
  parseApiDate,
  toApiDateTime,
} from '../../../utils/format'
import { parseDecimal, parsePercentage } from '../../../utils/numbers'

export type AnyExpense = ExpenseData | CarExpenseData | HouseExpenseData
export type AnyCreateExpenseModel =
  | CreateExpenseModel
  | CreateCarExpenseModel
  | CreateHouseExpenseModel
export type AnyUpdateExpenseModel =
  | UpdateExpenseModel
  | UpdateCarExpenseModel
  | UpdateHouseExpenseModel

/** One line of an invoice while it is being edited. */
export type ExpenseItemDraft = {
  key: string // stable React key, so removing an item keeps the others intact
  description: string
  expenseType: string
  amount: AmountState
  deductiblePercentage: string
  dpaCategory: string // CCA class, used for CCA items only
}

export type ExpenseDraft = {
  ownerId: string
  invoiceDate: Date
  notes: string
  paymentMethod: string // '' = not specified (business expenses only)
  items: ExpenseItemDraft[]
}

let itemCounter = 0

export const newItemDraft = (
  expenseType: string,
  hasTps: boolean,
  hasTvq: boolean,
): ExpenseItemDraft => ({
  key: `item-${Date.now()}-${itemCounter++}`,
  description: '',
  expenseType,
  amount: emptyAmount(AmountType.TaxesIncluded, hasTps, hasTvq),
  deductiblePercentage: '100',
  dpaCategory: '',
})

const ownerOf = (kind: ExpenseKind, expense: AnyExpense): string => {
  const field = EXPENSE_KINDS[kind].ownerField
  return field in expense ? String(expense[field as keyof AnyExpense]) : ''
}

/** Edit mode: one item holding the saved record, starting from its stored amounts. */
export const draftFromExpense = (
  kind: ExpenseKind,
  expense: AnyExpense,
): ExpenseDraft => ({
  ownerId: ownerOf(kind, expense),
  invoiceDate: parseApiDate(expense.invoiceDate),
  notes: expense.notes ?? '',
  paymentMethod: ('paymentMethod' in expense && expense.paymentMethod) || '',
  items: [
    {
      ...newItemDraft(expense.expenseType, expense.hasTps, expense.hasTvq),
      description: expense.description ?? '',
      amount: amountFromEntity(expense),
      dpaCategory: ('dpaCategory' in expense && expense.dpaCategory) || '',
      deductiblePercentage:
        'deductiblePercentage' in expense &&
        expense.deductiblePercentage != null
          ? String(expense.deductiblePercentage)
          : '100',
    },
  ],
})

/** The locale key of the first problem, or null when the draft can be saved. */
export const validateExpenseDraft = (
  kind: ExpenseKind,
  draft: ExpenseDraft,
): string | null => {
  if (draft.items.length === 0) return 'errorNoItems'
  if (!draft.ownerId) return 'errorOwnerRequired'
  if (draft.items.some((item) => parseDecimal(item.amount.amount) === null)) {
    return 'errorAmountInvalid'
  }
  if (
    kind === 'expense' &&
    draft.items.some(
      (item) => parsePercentage(item.deductiblePercentage) === null,
    )
  ) {
    return 'errorPercentageInvalid'
  }
  return null
}

const amounts = ({ result }: AmountState): TaxedAmounts => ({
  subtotal: result.subtotal,
  hasTps: result.hasTps,
  hasTvq: result.hasTvq,
  tps: result.tps,
  tvq: result.tvq,
  total: result.total,
})

const itemFields = (item: ExpenseItemDraft) => ({
  description: item.description.trim(), // may be empty: lists then show the type
  ...amounts(item.amount),
})

/** The CCA class is only kept for CCA expenses. */
const dpaCategory = (item: ExpenseItemDraft): string | null =>
  item.expenseType === ExpenseType.CapitalCostAllowance
    ? item.dpaCategory.trim() || null
    : null

const percentage = (item: ExpenseItemDraft) =>
  parsePercentage(item.deductiblePercentage) ?? 100

/** One record per invoice item; they share the group id, date, notes and files. */
export const buildCreateModels = (
  kind: ExpenseKind,
  draft: ExpenseDraft,
  attachments: Attachments,
  userId: string,
  groupId: string,
): AnyCreateExpenseModel[] =>
  draft.items.map((item): AnyCreateExpenseModel => {
    const common = {
      expenseGroupId: groupId,
      invoiceDate: toApiDateTime(draft.invoiceDate),
      notes: draft.notes,
      ...attachments,
      ...itemFields(item),
    }
    switch (kind) {
      case 'expense':
        return {
          ...common,
          userId,
          businessId: draft.ownerId,
          expenseType: item.expenseType as ExpenseType,
          dpaCategory: dpaCategory(item),
          paymentMethod: draft.paymentMethod || null,
          deductiblePercentage: percentage(item),
        }
      case 'car-expense':
        return {
          ...common,
          carId: draft.ownerId,
          expenseType: item.expenseType as CarExpenseType,
        }
      case 'house-expense':
        return {
          ...common,
          houseId: draft.ownerId,
          expenseType: item.expenseType as HouseExpenseType,
        }
    }
  })

/** Edit mode has exactly one item: the record being edited. */
export const buildUpdateModel = (
  kind: ExpenseKind,
  existing: AnyExpense,
  draft: ExpenseDraft,
  kept: Attachments,
  uploaded: Attachments,
): AnyUpdateExpenseModel => {
  const item = draft.items[0]
  const common = {
    id: existing.id,
    oldInvoiceDate: existing.invoiceDate,
    invoiceDate: keepDateIfUnchanged(existing.invoiceDate, draft.invoiceDate),
    notes: draft.notes,
    ...mergeAttachments(kept, uploaded),
    ...itemFields(item),
  }
  switch (kind) {
    case 'expense':
      return {
        ...common,
        businessId: draft.ownerId,
        expenseType: item.expenseType as ExpenseType,
        dpaCategory: dpaCategory(item),
        paymentMethod: draft.paymentMethod || null,
        deductiblePercentage: percentage(item),
      }
    case 'car-expense':
      return {
        ...common,
        carId: draft.ownerId,
        expenseType: item.expenseType as CarExpenseType,
      }
    case 'house-expense':
      return {
        ...common,
        houseId: draft.ownerId,
        expenseType: item.expenseType as HouseExpenseType,
      }
  }
}

/**
 * Saves the models one after the other and stops at the first failure, so the caller knows
 * exactly which ones exist (the first `saved`) and can keep only the rest for a retry.
 */
export async function saveSequentially<T>(
  models: T[],
  save: (model: T) => Promise<unknown>,
): Promise<{ saved: number; error: unknown }> {
  let saved = 0
  for (const model of models) {
    try {
      await save(model)
    } catch (error) {
      return { saved, error }
    }
    saved++
  }
  return { saved, error: undefined }
}
