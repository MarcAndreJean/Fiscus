import type { DocumentPickerAsset } from 'expo-document-picker'
import type { ImagePickerAsset } from 'expo-image-picker'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Chip, Text } from 'react-native-paper'

import FileUploadInput from './FileUploadInput'
import { Locales } from '../../../locales'
import type { Attachments } from '../../../types'
import { truncateFileName } from '../../../utils/files'

type Props = {
  /** Files already saved with the record (edit mode). */
  existing: Attachments
  onRemoveExisting: (kind: keyof Attachments, s3key: string) => void
  images: ImagePickerAsset[]
  onImagesChange: (images: ImagePickerAsset[]) => void
  files: DocumentPickerAsset[]
  onFilesChange: (files: DocumentPickerAsset[]) => void
}

/**
 * Saved attachments (removable) and the pickers for new ones. Removing a saved file only
 * detaches it from the record; the stored object is kept.
 */
const AttachmentsField = ({
  existing,
  onRemoveExisting,
  images,
  onImagesChange,
  files,
  onFilesChange,
}: Props) => {
  const saved = [
    ...existing.images.map((item) => ({ kind: 'images' as const, item })),
    ...existing.files.map((item) => ({ kind: 'files' as const, item })),
  ]

  return (
    <>
      {saved.length > 0 && (
        <View style={styles.saved}>
          <Text variant="titleSmall">{Locales.t('attachedFiles')}</Text>
          <View style={styles.chips}>
            {saved.map(({ kind, item }) => (
              <Chip
                key={item.s3key}
                icon={kind === 'images' ? 'image' : 'file'}
                onClose={() => onRemoveExisting(kind, item.s3key)}
              >
                {truncateFileName(item.fileName, 24)}
              </Chip>
            ))}
          </View>
        </View>
      )}
      <FileUploadInput
        images={images}
        onImageChange={onImagesChange}
        files={files}
        onFileChange={onFilesChange}
      />
    </>
  )
}

const styles = StyleSheet.create({
  saved: {
    marginBottom: 16,
    gap: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
})

export default AttachmentsField
