import { Locales } from '../../../locales'
import { enumLabel } from '../../../locales/enumLabel'
import { type MiscFileData, MiscFileCategory } from '../../../types'
import { formatDate, formatMoney } from '../../../utils/format'
import type { EntityField } from '../shared/EntityField'

export const miscFileFields = (file: MiscFileData): EntityField[] => [
  { label: Locales.t('description'), value: file.description },
  { label: Locales.t('viewerDate'), value: formatDate(file.date) },
  {
    label: Locales.t('viewerCategory'),
    value: enumLabel(MiscFileCategory, 'miscFileCategory', file.category),
  },
  {
    label: Locales.t('amount'),
    value: file.amount === null ? null : formatMoney(file.amount),
  },
  { label: Locales.t('notes'), value: file.notes },
  { label: Locales.t('creationDate'), value: formatDate(file.creationDate) },
]
