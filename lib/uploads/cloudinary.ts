import { AppError } from '@/lib/api/errors'

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export type CloudinaryEnvironment = {
  cloudName: string
  uploadPreset: string
}

export function isAllowedImageMimeType(mimeType: string): boolean {
  return ALLOWED_IMAGE_MIME_TYPES.includes(mimeType.toLowerCase() as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])
}

export function getCloudinaryEnvironment(): CloudinaryEnvironment | null {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim()
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim()

  if (!cloudName || !uploadPreset) {
    return null
  }

  return {
    cloudName,
    uploadPreset,
  }
}

export function requireCloudinaryEnvironment(): CloudinaryEnvironment {
  const environment = getCloudinaryEnvironment()

  if (!environment) {
    throw new AppError(
      'Cloudinary environment variables for unsigned uploads are not configured',
      'INTERNAL_ERROR'
    )
  }

  return environment
}
