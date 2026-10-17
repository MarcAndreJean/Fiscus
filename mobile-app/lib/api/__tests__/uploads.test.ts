import { describe, expect, it } from '@jest/globals'

import { FileCategory } from '../../types'
import type { ApiClient } from '../client'
import {
  createUploadCache,
  type PickedAssets,
  type UploadTarget,
} from '../files'

const fakeApi = () => {
  const posted: string[] = []
  const api = {
    post: async (_path: string, body: unknown) => {
      const { fileName } = body as { fileName: string }
      posted.push(fileName)
      if (fileName === 'bad.pdf') throw new Error('upload failed')
      return `key/${fileName}`
    },
  } as unknown as ApiClient
  return { api, posted }
}

const target: UploadTarget = {
  userId: 'u',
  tagId: 'b',
  category: FileCategory.Expense,
  year: 2025,
}

const assets = (...names: string[]): PickedAssets => ({
  images: [],
  files: names.map((name) => ({
    uri: `file://${name}`,
    name,
    size: 1,
    mimeType: 'application/pdf',
    lastModified: 0,
    file: undefined,
  })),
})

describe('createUploadCache', () => {
  it('does not upload the same file again when a save is retried', async () => {
    const { api, posted } = fakeApi()
    const cache = createUploadCache(async () => 'base64')
    const first = await cache.upload(api, target, assets('a.pdf', 'b.pdf'))
    const second = await cache.upload(api, target, assets('a.pdf', 'b.pdf'))
    expect(posted).toEqual(['a.pdf', 'b.pdf'])
    expect(second).toEqual(first)
    expect(first.files.map((f) => f.s3key)).toEqual(['key/a.pdf', 'key/b.pdf'])
  })

  it('keeps what was uploaded before a failure and retries only the rest', async () => {
    const { api, posted } = fakeApi()
    const cache = createUploadCache(async () => 'base64')
    await expect(
      cache.upload(api, target, assets('a.pdf', 'bad.pdf')),
    ).rejects.toThrow('upload failed')
    await expect(
      cache.upload(api, target, assets('a.pdf', 'bad.pdf')),
    ).rejects.toThrow('upload failed')
    expect(posted).toEqual(['a.pdf', 'bad.pdf', 'bad.pdf'])
  })

  it('uploads again when the target changes (another business or year)', async () => {
    const { api, posted } = fakeApi()
    const cache = createUploadCache(async () => 'base64')
    await cache.upload(api, target, assets('a.pdf'))
    await cache.upload(api, { ...target, year: 2024 }, assets('a.pdf'))
    expect(posted).toEqual(['a.pdf', 'a.pdf'])
  })
})
