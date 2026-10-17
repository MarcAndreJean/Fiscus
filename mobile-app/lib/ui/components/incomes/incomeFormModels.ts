import type {
  Attachments,
  CreateIncomeModel,
  IncomeData,
  IncomeItemModel,
  TaxedAmounts,
  UpdateIncomeModel,
} from '../../../types'
import {
  AmountType,
  type AmountState,
  amountFromEntity,
  emptyAmount,
  sumAmounts,
} from '../../../utils/amount'
import { mergeAttachments } from '../../../utils/files'
import {
  keepDateIfUnchanged,
  parseApiDate,
  toApiDateTime,
} from '../../../utils/format'
import { parseDecimal } from '../../../utils/numbers'

/** One invoice line while it is edited. */
export type IncomeLineDraft = {
  key: string // stable React key
  item: string
  amount: AmountState
}

let lineCounter = 0

export const newIncomeLine = (
  hasTps: boolean,
  hasTvq: boolean,
): IncomeLineDraft => ({
  key: `line-${Date.now()}-${lineCounter++}`,
  item: '',
  amount: emptyAmount(AmountType.TaxesExcluded, hasTps, hasTvq),
})

export type IncomeDraft = {
  businessId: string
  invoiceDate: Date
  clientName: string
  description: string
  notes: string
  paymentMethod: string // '' = not specified
  /** With lines, the income totals are the sum of the lines and `amount` is unused. */
  lines: IncomeLineDraft[]
  amount: AmountState
}

export const newIncomeDraft = (
  businessId: string,
  invoiceDate: Date,
  hasTps: boolean,
  hasTvq: boolean,
): IncomeDraft => ({
  businessId,
  invoiceDate,
  clientName: '',
  description: '',
  notes: '',
  paymentMethod: '',
  lines: [],
  amount: emptyAmount(AmountType.NoTaxes, hasTps, hasTvq),
})

export const draftFromIncome = (income: IncomeData): IncomeDraft => ({
  businessId: income.businessId,
  invoiceDate: parseApiDate(income.invoiceDate),
  clientName: income.clientName ?? '',
  description: income.description ?? '',
  notes: income.notes ?? '',
  paymentMethod: income.paymentMethod ?? '',
  lines: (income.items ?? []).map((line) => ({
    ...newIncomeLine(line.hasTps, line.hasTvq),
    item: line.item ?? '',
    amount: amountFromEntity(line),
  })),
  amount: amountFromEntity(income),
})

export const validateIncomeDraft = (draft: IncomeDraft): string | null => {
  if (!draft.businessId) return 'errorOwnerRequired'
  const amounts = draft.lines.length
    ? draft.lines.map((line) => line.amount.amount)
    : [draft.amount.amount]
  if (amounts.some((amount) => parseDecimal(amount) === null)) {
    return 'errorAmountInvalid'
  }
  return null
}

const lineItems = (draft: IncomeDraft): IncomeItemModel[] =>
  draft.lines.map((line) => ({ item: line.item.trim(), ...taxed(line.amount) }))

const taxed = ({ result }: AmountState): TaxedAmounts => ({
  subtotal: result.subtotal,
  hasTps: result.hasTps,
  hasTvq: result.hasTvq,
  tps: result.tps,
  tvq: result.tvq,
  total: result.total,
})

const fields = (draft: IncomeDraft) => {
  const items = lineItems(draft)
  return {
    businessId: draft.businessId,
    clientName: draft.clientName,
    description: draft.description,
    notes: draft.notes,
    paymentMethod: draft.paymentMethod || null,
    ...(items.length ? sumAmounts(items) : taxed(draft.amount)),
    items,
  }
}
export const buildIncomeCreateModel = (
  draft: IncomeDraft,
  attachments: Attachments,
  userId: string,
): CreateIncomeModel => ({
  userId,
  invoiceDate: toApiDateTime(draft.invoiceDate),
  ...fields(draft),
  ...attachments,
})

export const buildIncomeUpdateModel = (
  existing: IncomeData,
  draft: IncomeDraft,
  kept: Attachments,
  uploaded: Attachments,
): UpdateIncomeModel => ({
  id: existing.id,
  oldInvoiceDate: existing.invoiceDate,
  invoiceDate: keepDateIfUnchanged(existing.invoiceDate, draft.invoiceDate),
  ...fields(draft),
  ...mergeAttachments(kept, uploaded),
})
