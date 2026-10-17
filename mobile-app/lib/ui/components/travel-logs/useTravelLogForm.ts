import { router } from 'expo-router'
import { useState } from 'react'

import {
  buildTravelLogCreateModel,
  buildTravelLogUpdateModel,
  draftFromTravelLog,
  type TravelLogDraft,
  validateTravelLogDraft,
} from './travelLogFormModels'
import { useApiClient } from '../../../api/client'
import { useCreateTravelLog, useUpdateTravelLog } from '../../../api/travelLogs'
import { useAppContext } from '../../../context'
import { Locales } from '../../../locales'
import { useAuth } from '../../../settings'
import { FileCategory, type TravelLogData } from '../../../types'
import { defaultEntryDate } from '../../../utils/format'
import { useAttachments } from '../inputs/useAttachments'
import { useSubmit } from '../shared/useSubmit'

/** State and save logic of the travel log form (create or edit one trip). */
export function useTravelLogForm(existing?: TravelLogData) {
  const auth = useAuth()
  const { appContext } = useAppContext()
  const api = useApiClient()
  const create = useCreateTravelLog()
  const update = useUpdateTravelLog()

  const [draft, setDraft] = useState<TravelLogDraft>(() =>
    existing
      ? draftFromTravelLog(existing)
      : {
          businessId:
            appContext.currentBusinessId || (auth.businessIds[0] ?? ''),
          carId: appContext.currentCarId || (auth.carIds[0] ?? ''),
          travelDate: defaultEntryDate(appContext.currentYear),
          reason: '',
          notes: '',
          totalKm: '',
          consumption: '',
        },
  )
  const attachments = useAttachments(existing)

  const updateDraft = (patch: Partial<TravelLogDraft>) =>
    setDraft((current) => ({ ...current, ...patch }))

  const save = async () => {
    const problem = validateTravelLogDraft(draft)
    if (problem) throw new Error(Locales.t(problem))

    const uploaded = await attachments.upload(api, {
      userId: auth.userId,
      tagId: draft.businessId,
      category: FileCategory.TravelLog,
      year: draft.travelDate.getFullYear(),
    })

    if (existing) {
      await update.mutateAsync(
        buildTravelLogUpdateModel(existing, draft, attachments.kept, uploaded),
      )
    } else {
      await create.mutateAsync(
        buildTravelLogCreateModel(draft, uploaded, auth.userId),
      )
    }
  }

  const { submit, isSaving, error, clearError } = useSubmit(save, () =>
    router.back(),
  )

  return {
    draft,
    updateDraft,
    attachments,
    submit,
    isSaving,
    error,
    clearError,
  }
}
