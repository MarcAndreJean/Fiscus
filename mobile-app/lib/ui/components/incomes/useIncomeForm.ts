import { router } from 'expo-router'
import { useState } from 'react'

import {
  buildIncomeCreateModel,
  buildIncomeUpdateModel,
  draftFromIncome,
  type IncomeDraft,
  type IncomeLineDraft,
  newIncomeDraft,
  newIncomeLine,
  validateIncomeDraft,
} from './incomeFormModels'
import { useApiClient } from '../../../api/client'
import { useCreateIncome, useUpdateIncome } from '../../../api/incomes'
import { useAppContext } from '../../../context'
import { Locales } from '../../../locales'
import { useAuth } from '../../../settings'
import { FileCategory, type IncomeData } from '../../../types'
import { defaultEntryDate } from '../../../utils/format'
import { useAttachments } from '../inputs/useAttachments'
import { useSubmit } from '../shared/useSubmit'

/** State and save logic of the income form (create or edit one income). */
export function useIncomeForm(existing?: IncomeData) {
  const auth = useAuth()
  const { appContext } = useAppContext()
  const api = useApiClient()
  const create = useCreateIncome()
  const update = useUpdateIncome()

  const [draft, setDraft] = useState<IncomeDraft>(() =>
    existing
      ? draftFromIncome(existing)
      : newIncomeDraft(
          appContext.currentBusinessId || (auth.businessIds[0] ?? ''),
          defaultEntryDate(appContext.currentYear),
          auth.hasTps,
          auth.hasTvq,
        ),
  )
  const attachments = useAttachments(existing)

  const updateDraft = (patch: Partial<IncomeDraft>) =>
    setDraft((current) => ({ ...current, ...patch }))

  const addLine = () =>
    setDraft((current) => ({
      ...current,
      lines: [...current.lines, newIncomeLine(auth.hasTps, auth.hasTvq)],
    }))

  const updateLine = (key: string, patch: Partial<IncomeLineDraft>) =>
    setDraft((current) => ({
      ...current,
      lines: current.lines.map((line) =>
        line.key === key ? { ...line, ...patch } : line,
      ),
    }))

  const removeLine = (key: string) =>
    setDraft((current) => ({
      ...current,
      lines: current.lines.filter((line) => line.key !== key),
    }))

  const save = async () => {
    const problem = validateIncomeDraft(draft)
    if (problem) throw new Error(Locales.t(problem))

    const uploaded = await attachments.upload(api, {
      userId: auth.userId,
      tagId: draft.businessId,
      category: FileCategory.Invoice,
      year: draft.invoiceDate.getFullYear(),
    })

    if (existing) {
      await update.mutateAsync(
        buildIncomeUpdateModel(existing, draft, attachments.kept, uploaded),
      )
    } else {
      await create.mutateAsync(
        buildIncomeCreateModel(draft, uploaded, auth.userId),
      )
    }
  }

  const { submit, isSaving, error, clearError } = useSubmit(save, () =>
    router.back(),
  )

  return {
    draft,
    updateDraft,
    addLine,
    updateLine,
    removeLine,
    attachments,
    submit,
    isSaving,
    error,
    clearError,
  }
}
