import type { ErrorCode } from '@/lib/api/errors'

export type ApiSuccess<T> = {
  success: true
  data: T
}

export type ApiError = {
  success: false
  error: {
    message: string
    code?: ErrorCode
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export function ok<T>(data: T): ApiSuccess<T> {
  return {
    success: true,
    data,
  }
}

export function fail(message: string, code?: ErrorCode): ApiError {
  return {
    success: false,
    error: {
      message,
      code,
    },
  }
}
