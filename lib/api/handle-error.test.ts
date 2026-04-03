import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppError } from '@/lib/api/errors'
import { handleError } from '@/lib/api/handle-error'

describe('handleError', () => {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  afterEach(() => {
    errorSpy.mockClear()
  })

  it('returns structured API errors for AppError and logs merged context', () => {
    const response = handleError(new AppError('Conflict detected', 'CONFLICT', { source: 'service' }), {
      context: { action: 'updateProfile' },
      userId: 'user-1',
    })

    expect(response).toEqual({
      success: false,
      error: {
        message: 'Conflict detected',
        code: 'CONFLICT',
      },
    })

    expect(errorSpy).toHaveBeenCalledWith({
      code: 'CONFLICT',
      message: 'Conflict detected',
      context: {
        action: 'updateProfile',
        source: 'service',
      },
      userId: 'user-1',
    })
  })

  it('normalizes unknown errors with fallback message', () => {
    const response = handleError({ unexpected: true }, { fallbackMessage: 'Unexpected failure' })

    expect(response).toEqual({
      success: false,
      error: {
        message: 'Unexpected failure',
        code: 'INTERNAL_ERROR',
      },
    })

    expect(errorSpy).toHaveBeenCalledWith({
      code: 'INTERNAL_ERROR',
      message: 'Unexpected failure',
      context: {
        rawError: { unexpected: true },
      },
      userId: null,
    })
  })
})
