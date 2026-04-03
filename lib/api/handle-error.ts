import { isAppError, toAppError, type ErrorCode } from '@/lib/api/errors'
import { fail, type ApiError } from '@/lib/api/response'

type HandleErrorOptions = {
  context?: Record<string, unknown>
  userId?: string | null
  fallbackMessage?: string
  defaultCode?: ErrorCode
}

export function handleError(error: unknown, options: HandleErrorOptions = {}): ApiError {
  const appError = isAppError(error)
    ? error
    : toAppError(error, options.fallbackMessage ?? 'Unexpected failure')

  const code = appError.code ?? options.defaultCode
  const context = {
    ...(options.context ?? {}),
    ...(appError.context ?? {}),
  }

  console.error({
    code,
    message: appError.message,
    context,
    userId: options.userId ?? null,
  })

  return fail(appError.message, code)
}
