import { afterEach, describe, expect, it } from 'vitest'

import { AppError } from '@/lib/api/errors'
import { getSupabaseEnvironment, requireSupabaseEnvironment } from '@/lib/supabase/env'

const ORIGINAL_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_ENV.NEXT_PUBLIC_SUPABASE_URL
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ORIGINAL_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY
})

describe('supabase env helpers', () => {
  it('returns null when required env vars are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    expect(getSupabaseEnvironment()).toBeNull()
  })

  it('returns normalized env values when configured', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ' https://example.supabase.co '
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ' anon-key '

    expect(getSupabaseEnvironment()).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
    })
  })

  it('throws AppError when required env vars are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    expect(() => requireSupabaseEnvironment()).toThrowError(AppError)
  })
})