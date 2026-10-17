import type { DocumentPickerAsset } from 'expo-document-picker'
import type { ImagePickerAsset } from 'expo-image-picker'

export type FileUploadInputProps = {
  files: DocumentPickerAsset[]
  onFileChange: (files: DocumentPickerAsset[]) => void
  images: ImagePickerAsset[]
  onImageChange: (images: ImagePickerAsset[]) => void
}
