import { NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { isAppError } from '@/lib/api/errors'
import {
  isAllowedImageMimeType,
  MAX_UPLOAD_BYTES,
  requireCloudinaryEnvironment,
} from '@/lib/uploads/cloudinary'

export const runtime = 'nodejs'

type CloudinaryUploadResponse = {
  secure_url?: string
  error?: {
    message?: string
  }
}

type UploadRouteResponse = {
  success: boolean
  data?: {
    url: string
  }
  error?: {
    message: string
    code?: 'INVALID_INPUT' | 'UNAUTHENTICATED' | 'INTERNAL_ERROR'
  }
}

function buildErrorResponse(
  message: string,
  status: number,
  code: 'INVALID_INPUT' | 'UNAUTHENTICATED' | 'INTERNAL_ERROR'
) {
  const payload: UploadRouteResponse = {
    success: false,
    error: {
      message,
      code,
    },
  }

  return NextResponse.json(payload, { status })
}

export async function POST(request: Request) {
  try {
    await requireAuth()

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return buildErrorResponse('The request must include a file.', 400, 'INVALID_INPUT')
    }

    if (!isAllowedImageMimeType(file.type)) {
      return buildErrorResponse(
        'Only JPEG, PNG, WEBP, and GIF files are allowed.',
        415,
        'INVALID_INPUT'
      )
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return buildErrorResponse('The image exceeds the 10MB limit.', 413, 'INVALID_INPUT')
    }

    const cloudinary = requireCloudinaryEnvironment()

    const cloudinaryBody = new FormData()
    cloudinaryBody.append('file', file)
    cloudinaryBody.append('upload_preset', cloudinary.uploadPreset)

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/image/upload`,
      {
        method: 'POST',
        body: cloudinaryBody,
      }
    )

    const cloudinaryPayload = (await cloudinaryResponse.json()) as CloudinaryUploadResponse

    if (!cloudinaryResponse.ok || !cloudinaryPayload.secure_url) {
      return buildErrorResponse(
        cloudinaryPayload.error?.message ?? 'Cloudinary upload failed.',
        502,
        'INTERNAL_ERROR'
      )
    }

    const payload: UploadRouteResponse = {
      success: true,
      data: {
        url: cloudinaryPayload.secure_url,
      },
    }

    return NextResponse.json(payload)
  } catch (error) {
    if (isAppError(error) && error.code === 'UNAUTHENTICATED') {
      return buildErrorResponse('Authentication required.', 401, 'UNAUTHENTICATED')
    }

    return buildErrorResponse('Unexpected upload failure.', 500, 'INTERNAL_ERROR')
  }
}
