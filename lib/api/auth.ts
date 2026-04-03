import 'server-only'

import type { User } from '@supabase/supabase-js'

import { AppError } from '@/lib/api/errors'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function requireAuth(): Promise<User> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AppError('Authentication required', 'UNAUTHENTICATED')
  }

  return user
}
