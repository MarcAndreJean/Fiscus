import { useState } from 'react'

import type { ApiClient } from '../../../api/client'
import {
  createUploadCache,
  type PickedAssets,
  type UploadTarget,
} from '../../../api/files'
import type { Attachments } from '../../../types'

/** Saved attachments a form keeps, the new files it picked, and props for AttachmentsField. */
export function useAttachments(initial?: Attachments) {
  const [kept, setKept] = useState<Attachments>({
    images: initial?.images ?? [],
    files: initial?.files ?? [],
  })
  const [assets, setAssets] = useState<PickedAssets>({ images: [], files: [] })
  // One cache per form: retrying a failed save reuses files already uploaded.
  const [cache] = useState(() => createUploadCache())
  const upload = (api: ApiClient, target: UploadTarget) =>
    cache.upload(api, target, assets)

  const fieldProps = {
    existing: kept,
    onRemoveExisting: (field: keyof Attachments, s3key: string) =>
      setKept((current) => ({
        ...current,
        [field]: current[field].filter((file) => file.s3key !== s3key),
      })),
    images: assets.images,
    onImagesChange: (images: PickedAssets['images']) =>
      setAssets((current) => ({ ...current, images })),
    files: assets.files,
    onFilesChange: (files: PickedAssets['files']) =>
      setAssets((current) => ({ ...current, files })),
  }

  return { kept, assets, fieldProps, upload }
}
