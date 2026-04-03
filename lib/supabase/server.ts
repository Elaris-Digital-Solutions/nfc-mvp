import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from '@/types/database'
import { requireSupabaseEnvironment } from '@/lib/supabase/env'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  const env = requireSupabaseEnvironment()

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // No-op in contexts where setting cookies is not allowed.
        }
      },
    },
  })
}

export const createClient = createServerSupabaseClient
