import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type {
  ActionButtonRow,
  ProfileRepository,
  ProfileRow,
  RepositoryResult,
  UsernameConflictRow,
} from '@/lib/repositories/profile/profile.repository'

function toResult<T>(data: T | null, error: string | null): RepositoryResult<T> {
  return { data, error }
}

export async function createSupabaseProfileRepository(): Promise<ProfileRepository> {
  const supabase = await createServerSupabaseClient()

  return {
    async findById(profileId) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', profileId).single()

      return toResult((data as ProfileRow | null) ?? null, error?.message ?? null)
    },

    async findByUsername(username) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      return toResult((data as ProfileRow | null) ?? null, error?.message ?? null)
    },

    async findUsernameConflict(username, excludingProfileId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', excludingProfileId)
        .maybeSingle()

      return toResult((data as UsernameConflictRow | null) ?? null, error?.message ?? null)
    },

    async updateById(profileId, payload) {
      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', profileId)
        .select('*')
        .single()

      return toResult((data as ProfileRow | null) ?? null, error?.message ?? null)
    },

    async listActiveLinks(profileId) {
      const { data, error } = await supabase
        .from('action_buttons')
        .select('*')
        .eq('profile_id', profileId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })

      if (error) {
        return toResult<ActionButtonRow[]>(null, error.message)
      }

      return toResult((data as ActionButtonRow[] | null) ?? [], null)
    },
  }
}