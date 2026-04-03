import { AppError } from '@/lib/api/errors'

export type SupabaseEnvironment = {
  url: string
  anonKey: string
}

export function getSupabaseEnvironment(): SupabaseEnvironment | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !anonKey) {
    return null
  }

  return {
    url,
    anonKey,
  }
}

export function requireSupabaseEnvironment(): SupabaseEnvironment {
  const env = getSupabaseEnvironment()

  if (!env) {
    throw new AppError('Supabase environment variables are not configured', 'INTERNAL_ERROR')
  }

  return env
}
