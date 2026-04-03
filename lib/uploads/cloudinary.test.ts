import { afterEach, describe, expect, it } from 'vitest'

import {
  createCloudinarySignature,
  getCloudinaryEnvironment,
  isAllowedImageMimeType,
} from '@/lib/uploads/cloudinary'

const ORIGINAL_ENV = {
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_UPLOAD_FOLDER: process.env.CLOUDINARY_UPLOAD_FOLDER,
}

afterEach(() => {
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = ORIGINAL_ENV.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  process.env.CLOUDINARY_API_KEY = ORIGINAL_ENV.CLOUDINARY_API_KEY
  process.env.CLOUDINARY_API_SECRET = ORIGINAL_ENV.CLOUDINARY_API_SECRET
  process.env.CLOUDINARY_UPLOAD_FOLDER = ORIGINAL_ENV.CLOUDINARY_UPLOAD_FOLDER
})

describe('cloudinary upload helpers', () => {
  it('returns null if required environment variables are missing', () => {
    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    delete process.env.CLOUDINARY_API_KEY
    delete process.env.CLOUDINARY_API_SECRET

    expect(getCloudinaryEnvironment()).toBeNull()
  })

  it('returns normalized values when configured', () => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = ' demo '
    process.env.CLOUDINARY_API_KEY = ' key '
    process.env.CLOUDINARY_API_SECRET = ' secret '
    process.env.CLOUDINARY_UPLOAD_FOLDER = ' folder '

    expect(getCloudinaryEnvironment()).toEqual({
      cloudName: 'demo',
      apiKey: 'key',
      apiSecret: 'secret',
      folder: 'folder',
    })
  })

  it('builds deterministic signatures', () => {
    const signature = createCloudinarySignature(
      {
        timestamp: 1712000000,
        folder: 'cards',
      },
      'top-secret'
    )

    expect(signature).toMatch(/^[a-f0-9]{40}$/)
  })

  it('validates image mime types', () => {
    expect(isAllowedImageMimeType('image/jpeg')).toBe(true)
    expect(isAllowedImageMimeType('image/png')).toBe(true)
    expect(isAllowedImageMimeType('text/plain')).toBe(false)
  })
})
