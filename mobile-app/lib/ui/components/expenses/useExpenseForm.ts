import { router } from 'expo-router'
import { useRef, useState } from 'react'

import {
  type AnyCreateExpenseModel,
  type AnyExpense,
  type AnyUpdateExpenseModel,
  buildCreateModels,
  buildUpdateModel,
  draftFromExpense,
  type ExpenseDraft,
  type ExpenseItemDraft,
  newItemDraft,
  saveSequentially,
  validateExpenseDraft,
} from './expenseFormModels'
import { EXPENSE_KINDS, type ExpenseKind } from './expenseKinds'
import { errorMessage, useApiClient } from '../../../api/client'
import { useCreateEntity, useUpdateEntity } from '../../../api/entities'
import { useAppContext } from '../../../context'
import { Locales } from '../../../locales'
import { useAuth } from '../../../settings'
import { defaultEntryDate } from '../../../utils/format'
import { useAttachments } from '../inputs/useAttachments'
import { useSubmit } from '../shared/useSubmit'

/** State and save logic of the shared expense form (create: many items; edit: one). */
export function useExpenseForm(kind: ExpenseKind, existing?: AnyExpense) {
  const config = EXPENSE_KINDS[kind]
  const auth = useAuth()
  const { appContext, updateAppContext } = useAppContext()
  const api = useApiClient()
  const create = useCreateEntity<AnyCreateExpenseModel>(config.resource)
  const update = useUpdateEntity<AnyUpdateExpenseModel, AnyExpense>(
    config.resource,
    config.parse,
  )

  const [draft, setDraft] = useState<ExpenseDraft>(() =>
    existing
      ? draftFromExpense(kind, existing)
      : {
          ownerId:
            config.currentOwner(appContext) || (config.ownerIds(auth)[0] ?? ''),
          invoiceDate: defaultEntryDate(appContext.currentYear),
          notes: '',
          paymentMethod: '',
          items: [
            newItemDraft(config.lastType(appContext), auth.hasTps, auth.hasTvq),
          ],
        },
  )
  const attachments = useAttachments(existing)
  // Made on the first save and reused by retries, so a partly saved invoice stays one group.
  const groupId = useRef<string | null>(null)

  const updateDraft = (patch: Partial<ExpenseDraft>) =>
    setDraft((current) => ({ ...current, ...patch }))

  const updateItem = (key: string, patch: Partial<ExpenseItemDraft>) =>
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.key === key ? { ...item, ...patch } : item,
      ),
    }))

  const addItem = () =>
    setDraft((current) => ({
      ...current,
      items: [
        ...current.items,
        newItemDraft(config.lastType(appContext), auth.hasTps, auth.hasTvq),
      ],
    }))

  const removeItem = (key: string) =>
    setDraft((current) => ({
      ...current,
      items: current.items.filter((item) => item.key !== key),
    }))

  const save = async () => {
    const problem = validateExpenseDraft(kind, draft)
    if (problem) throw new Error(Locales.t(problem))

    const uploaded = await attachments.upload(api, {
      userId: auth.userId,
      tagId: draft.ownerId,
      category: config.fileCategory,
      year: draft.invoiceDate.getFullYear(),
    })

    if (existing) {
      await update.mutateAsync(
        buildUpdateModel(kind, existing, draft, attachments.kept, uploaded),
      )
    } else {
      groupId.current ??= Date.now().toString()
      const models = buildCreateModels(
        kind,
        draft,
        uploaded,
        auth.userId,
        groupId.current,
      )
      const { saved, error } = await saveSequentially(models, (model) =>
        create.mutateAsync(model),
      )
      if (error) {
        if (saved === 0) throw error
        // Keep only the items that were not saved, so pressing Save again does not duplicate.
        setDraft((current) => ({
          ...current,
          items: current.items.slice(saved),
        }))
        throw new Error(
          Locales.t('savedPartially', {
            saved,
            total: models.length,
            error: errorMessage(error),
          }),
        )
      }
      updateAppContext(config.rememberType(draft.items[0].expenseType))
    }
  }

  const { submit, isSaving, error, clearError } = useSubmit(save, () =>
    router.back(),
  )

  return {
    config,
    draft,
    updateDraft,
    updateItem,
    addItem,
    removeItem,
    attachments,
    submit,
    isSaving,
    error,
    clearError,
  }
}
