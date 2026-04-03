'use client'

import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types/database'
import { requireSupabaseEnvironment } from '@/lib/supabase/env'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createBrowserSupabaseClient() {
  if (browserClient) {
    return browserClient
  }

  const env = requireSupabaseEnvironment()

  browserClient = createBrowserClient<Database>(env.url, env.anonKey)
  return browserClient
}

export const createClient = createBrowserSupabaseClient
