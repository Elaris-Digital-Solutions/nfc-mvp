export type ErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHENTICATED'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'

export type ErrorContext = Record<string, unknown>

export class AppError extends Error {
  readonly code: ErrorCode
  readonly context?: ErrorContext

  constructor(message: string, code: ErrorCode = 'INTERNAL_ERROR', context?: ErrorContext) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.context = context
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function toAppError(error: unknown, fallbackMessage = 'Unexpected error'): AppError {
  if (isAppError(error)) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(error.message || fallbackMessage, 'INTERNAL_ERROR')
  }

  return new AppError(fallbackMessage, 'INTERNAL_ERROR', { rawError: error })
}
