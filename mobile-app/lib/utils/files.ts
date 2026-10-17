import type { Attachments } from '../types/FileModels'

export const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: XLSX_MIME,
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
  json: 'application/json',
  xml: 'application/xml',
  zip: 'application/zip',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
}

export const getMimeType = (fileName: string): string => {
  const dot = fileName.lastIndexOf('.')
  const extension = dot === -1 ? '' : fileName.slice(dot + 1).toLowerCase()
  return MIME_TYPES[extension] ?? 'application/octet-stream'
}

export const humanizeFileSize = (size?: number): string => {
  if (!size) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

/** Shortens a long file name in the middle, keeping its extension. */
export const truncateFileName = (name: string, max = 30): string => {
  if (name.length <= max) return name
  const dot = name.lastIndexOf('.')
  const extension = dot > 0 ? name.slice(dot) : ''
  return `${name.slice(0, max - extension.length - 1)}…${extension}`
}

/** A list stored as JSON text by the API (images, files, items), or [] if unreadable. */
export const parseJsonList = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[]
  if (typeof value !== 'string') return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

/** Web only: a picked File as base64 (without the "data:...;base64," prefix). */
export const readWebFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

/** Attachments kept on a record plus the ones just uploaded. */
export const mergeAttachments = (
  kept: Attachments,
  uploaded: Attachments,
): Attachments => ({
  images: [...kept.images, ...uploaded.images],
  files: [...kept.files, ...uploaded.files],
})
