import { describe, expect, it } from '@jest/globals'

import { type MiscFileData, MiscFileCategory } from '../../../../types'
import {
  buildMiscFileCreateModel,
  buildMiscFileUpdateModel,
  draftFromMiscFile,
  type MiscFileDraft,
  validateMiscFileDraft,
} from '../miscFileFormModels'

const draft = (overrides: Partial<MiscFileDraft> = {}): MiscFileDraft => ({
  date: new Date(2025, 0, 2, 3, 4, 5, 0),
  description: 'Glasses',
  category: MiscFileCategory.Medical,
  notes: '',
  amount: '',
  ...overrides,
})

describe('validateMiscFileDraft', () => {
  it('accepts an entry without an amount', () => {
    expect(validateMiscFileDraft(draft())).toBeNull()
  })

  it('rejects an amount that is not a number', () => {
    expect(validateMiscFileDraft(draft({ amount: 'free' }))).toBe(
      'errorNumberInvalid',
    )
  })
})

describe('buildMiscFileCreateModel', () => {
  it('sends an empty amount as null and reads comma decimals', () => {
    const empty = buildMiscFileCreateModel(
      draft(),
      { images: [], files: [] },
      'u1',
    )
    expect(empty).toEqual({
      userId: 'u1',
      date: '2025-01-02T03:04:05.000',
      description: 'Glasses',
      category: 'medical',
      notes: '',
      amount: null,
      images: [],
      files: [],
    })
    expect(
      buildMiscFileCreateModel(
        draft({ amount: '89,99' }),
        { images: [], files: [] },
        'u1',
      ).amount,
    ).toBe(89.99)
  })
})

describe('buildMiscFileUpdateModel', () => {
  it('keeps the stored date and sends no owner', () => {
    const existing: MiscFileData = {
      id: 'm1',
      userId: 'u1',
      date: '2025-01-02T03:04:05.000',
      description: 'd',
      notes: '',
      category: MiscFileCategory.Others,
      amount: 12,
      creationDate: '2025-01-03T00:00:00',
      images: [],
      files: [],
    }
    const start = draftFromMiscFile(existing)
    expect(start.amount).toBe('12')
    const model = buildMiscFileUpdateModel(
      existing,
      { ...start, amount: '' },
      { images: [], files: [] },
      { images: [], files: [] },
    )
    expect(model).toMatchObject({
      id: 'm1',
      oldDate: '2025-01-02T03:04:05.000',
      date: '2025-01-02T03:04:05.000',
      amount: null,
    })
    expect(model).not.toHaveProperty('userId')
  })
})

describe('draftFromMiscFile with a missing amount', () => {
  it('treats it as empty', () => {
    const old = {
      id: 'm',
      userId: 'u',
      date: '2025-01-01',
      description: '',
      notes: '',
      category: MiscFileCategory.Others,
      creationDate: '',
      images: [],
      files: [],
    } as unknown as MiscFileData
    expect(draftFromMiscFile(old).amount).toBe('')
  })
})
