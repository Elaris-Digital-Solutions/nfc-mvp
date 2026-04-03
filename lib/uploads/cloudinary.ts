import crypto from 'node:crypto'

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
  apiKey: string
  apiSecret: string
  folder: string
}

export function isAllowedImageMimeType(mimeType: string): boolean {
  return ALLOWED_IMAGE_MIME_TYPES.includes(mimeType.toLowerCase() as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])
}

export function createCloudinarySignature(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const payload = Object.keys(params)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  return crypto.createHash('sha1').update(`${payload}${apiSecret}`).digest('hex')
}

export function getCloudinaryEnvironment(): CloudinaryEnvironment | null {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim()
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || 'linktree-cards'

  if (!cloudName || !apiKey || !apiSecret) {
    return null
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    folder,
  }
}

export function requireCloudinaryEnvironment(): CloudinaryEnvironment {
  const environment = getCloudinaryEnvironment()

  if (!environment) {
    throw new AppError(
      'Cloudinary environment variables are not configured',
      'INTERNAL_ERROR'
    )
  }

  return environment
}
