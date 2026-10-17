import React from 'react'
import { Platform } from 'react-native'

import FileUploadInputCore from './FileUploadInputCore'
import WebFileUploadInputCore from './WebFileUploadInputCore'
import type { FileUploadInputProps } from './fileUploadTypes'

const FileUploadInput = (props: FileUploadInputProps) => {
  return Platform.OS === 'web' ? (
    <WebFileUploadInputCore {...props} />
  ) : (
    <FileUploadInputCore {...props} />
  )
}

export default FileUploadInput
