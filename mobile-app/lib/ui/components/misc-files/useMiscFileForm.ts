import { router } from 'expo-router'
import { useState } from 'react'

import {
  buildMiscFileCreateModel,
  buildMiscFileUpdateModel,
  draftFromMiscFile,
  type MiscFileDraft,
  validateMiscFileDraft,
} from './miscFileFormModels'
import { useApiClient } from '../../../api/client'
import { useCreateMiscFile, useUpdateMiscFile } from '../../../api/miscFiles'
import { useAppContext } from '../../../context'
import { Locales } from '../../../locales'
import { useAuth } from '../../../settings'
import {
  FileCategory,
  MiscFileCategory,
  type MiscFileData,
} from '../../../types'
import { defaultEntryDate } from '../../../utils/format'
import { useAttachments } from '../inputs/useAttachments'
import { useSubmit } from '../shared/useSubmit'

/** State and save logic of the misc file form (create or edit one file). */
export function useMiscFileForm(existing?: MiscFileData) {
  const auth = useAuth()
  const { appContext } = useAppContext()
  const api = useApiClient()
  const create = useCreateMiscFile()
  const update = useUpdateMiscFile()

  const [draft, setDraft] = useState<MiscFileDraft>(() =>
    existing
      ? draftFromMiscFile(existing)
      : {
          date: defaultEntryDate(appContext.currentYear),
          description: '',
          category: MiscFileCategory.Medical,
          notes: '',
          amount: '',
        },
  )
  const attachments = useAttachments(existing)

  const updateDraft = (patch: Partial<MiscFileDraft>) =>
    setDraft((current) => ({ ...current, ...patch }))

  const save = async () => {
    const problem = validateMiscFileDraft(draft)
    if (problem) throw new Error(Locales.t(problem))

    const uploaded = await attachments.upload(api, {
      userId: auth.userId,
      tagId: null, // misc files are filed under the user only
      category: FileCategory.MiscFile,
      year: draft.date.getFullYear(),
    })

    if (existing) {
      await update.mutateAsync(
        buildMiscFileUpdateModel(existing, draft, attachments.kept, uploaded),
      )
    } else {
      await create.mutateAsync(
        buildMiscFileCreateModel(draft, uploaded, auth.userId),
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
