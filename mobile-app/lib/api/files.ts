import type { DocumentPickerAsset } from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import type { ImagePickerAsset } from 'expo-image-picker'
import { Platform } from 'react-native'

import { type ApiClient, filePath } from './client'
import type {
  Attachments,
  CreateFileModel,
  FileCategory,
  FileJsonItem,
} from '../types'
import { readWebFileAsBase64 } from '../utils/files'
import { toApiDateTime } from '../utils/format'

/** Where uploaded files are filed in the bucket. */
export type UploadTarget = {
  userId: string
  tagId: string | null // businessId, carId or houseId
  category: FileCategory
  year: number
}

export type PickedAssets = {
  images: ImagePickerAsset[]
  files: DocumentPickerAsset[]
}

export const getFileUrl = (api: ApiClient, s3key: string): Promise<string> =>
  api.get<string>(filePath(s3key))

type UploadSource = { name: string; size: number; read: () => Promise<string> }

const readNativeFile = (uri: string) =>
  FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  })

const fallbackName = () => `no-file-name-${toApiDateTime(new Date())}`

const fromImage = (asset: ImagePickerAsset): UploadSource => ({
  name: asset.fileName ?? fallbackName(),
  size: asset.fileSize ?? 0,
  read: () =>
    Platform.OS === 'web' && asset.base64
      ? Promise.resolve(asset.base64)
      : readNativeFile(asset.uri),
})

const fromDocument = (asset: DocumentPickerAsset): UploadSource => ({
  name: asset.name ?? fallbackName(),
  size: asset.size ?? 0,
  read: () =>
    Platform.OS === 'web' && asset.file
      ? readWebFileAsBase64(asset.file)
      : readNativeFile(asset.uri),
})

type ReadContent = (source: UploadSource) => Promise<string>

async function upload(
  api: ApiClient,
  target: UploadTarget,
  source: UploadSource,
  read: ReadContent,
): Promise<FileJsonItem> {
  const model: CreateFileModel = {
    ...target,
    fileName: source.name,
    fileContent: await read(source),
  }
  const s3key = await api.post<string>('/files', model)
  return { s3key, fileName: source.name, size: source.size }
}

/**
 * Uploads picked files one at a time and remembers each result, so retrying a failed save
 * does not upload (and orphan) the same files again. A different target (owner, category
 * or year) uploads again, since the file lands in another folder.
 */
export function createUploadCache(
  read: ReadContent = (source) => source.read(),
) {
  const done = new Map<string, FileJsonItem>()

  const uploadOnce = async (
    api: ApiClient,
    target: UploadTarget,
    key: string,
    source: UploadSource,
  ) => {
    const cacheKey = `${target.userId}|${target.tagId}|${target.category}|${target.year}|${key}`
    const cached = done.get(cacheKey)
    if (cached) return cached
    const result = await upload(api, target, source, read)
    done.set(cacheKey, result)
    return result
  }

  return {
    async upload(
      api: ApiClient,
      target: UploadTarget,
      assets: PickedAssets,
    ): Promise<Attachments> {
      const images: FileJsonItem[] = []
      for (const asset of assets.images) {
        images.push(
          await uploadOnce(api, target, `image|${asset.uri}`, fromImage(asset)),
        )
      }
      const files: FileJsonItem[] = []
      for (const asset of assets.files) {
        files.push(
          await uploadOnce(
            api,
            target,
            `file|${asset.uri}`,
            fromDocument(asset),
          ),
        )
      }
      return { images, files }
    },
  }
}
