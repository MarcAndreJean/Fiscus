import type {
  Attachments,
  CreateMiscFileModel,
  MiscFileCategory,
  MiscFileData,
  UpdateMiscFileModel,
} from '../../../types'
import { mergeAttachments } from '../../../utils/files'
import {
  keepDateIfUnchanged,
  parseApiDate,
  toApiDateTime,
} from '../../../utils/format'
import { parseDecimal } from '../../../utils/numbers'

export type MiscFileDraft = {
  date: Date
  description: string
  category: MiscFileCategory
  notes: string
  amount: string // optional
}

export const draftFromMiscFile = (file: MiscFileData): MiscFileDraft => ({
  date: parseApiDate(file.date),
  description: file.description ?? '',
  category: file.category,
  notes: file.notes ?? '',
  amount: file.amount == null ? '' : String(file.amount),
})

export const validateMiscFileDraft = (draft: MiscFileDraft): string | null =>
  draft.amount.trim() && parseDecimal(draft.amount) === null
    ? 'errorNumberInvalid'
    : null

const fields = (draft: MiscFileDraft) => ({
  description: draft.description,
  category: draft.category,
  notes: draft.notes,
  amount: parseDecimal(draft.amount),
})

export const buildMiscFileCreateModel = (
  draft: MiscFileDraft,
  attachments: Attachments,
  userId: string,
): CreateMiscFileModel => ({
  userId,
  date: toApiDateTime(draft.date),
  ...fields(draft),
  ...attachments,
})

export const buildMiscFileUpdateModel = (
  existing: MiscFileData,
  draft: MiscFileDraft,
  kept: Attachments,
  uploaded: Attachments,
): UpdateMiscFileModel => ({
  id: existing.id,
  oldDate: existing.date,
  date: keepDateIfUnchanged(existing.date, draft.date),
  ...fields(draft),
  ...mergeAttachments(kept, uploaded),
})
