import { z } from 'zod'

import { AppError } from '@/lib/api/errors'

export function validateInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input)

  if (!parsed.success) {
    throw new AppError('Invalid input', 'INVALID_INPUT', {
      issues: parsed.error.flatten(),
    })
  }

  return parsed.data
}
