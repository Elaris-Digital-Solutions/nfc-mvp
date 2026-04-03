import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type {
  ActionButtonRow,
  LinksRepository,
  LinkIdRow,
  RepositoryResult,
} from '@/lib/repositories/links/links.repository'

function toResult<T>(data: T | null, error: string | null): RepositoryResult<T> {
  return { data, error }
}

export async function createSupabaseLinksRepository(): Promise<LinksRepository> {
  const supabase = await createServerSupabaseClient()

  return {
    async listActiveByProfileId(profileId) {
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

    async countActiveByProfileId(profileId) {
      const { count, error } = await supabase
        .from('action_buttons')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', profileId)
        .eq('is_active', true)
        .is('deleted_at', null)

      if (error) {
        return toResult<number>(null, error.message)
      }

      return toResult(count ?? 0, null)
    },

    async findByIdForProfile(linkId, profileId) {
      const { data, error } = await supabase
        .from('action_buttons')
        .select('*')
        .eq('id', linkId)
        .eq('profile_id', profileId)
        .single()

      return toResult((data as ActionButtonRow | null) ?? null, error?.message ?? null)
    },

    async insert(payload) {
      const { data, error } = await supabase.from('action_buttons').insert(payload).select('*').single()

      return toResult((data as ActionButtonRow | null) ?? null, error?.message ?? null)
    },

    async updateActiveByIdForProfile(linkId, profileId, payload, expectedUpdatedAt) {
      let query = supabase
        .from('action_buttons')
        .update(payload)
        .eq('id', linkId)
        .eq('profile_id', profileId)
        .is('deleted_at', null)

      if (expectedUpdatedAt) {
        query = query.eq('updated_at', expectedUpdatedAt)
      }

      const { data, error } = await query
        .select('*')
        .single()

      return toResult((data as ActionButtonRow | null) ?? null, error?.message ?? null)
    },

    async softDeleteByIdForProfile(linkId, profileId, deletedAt) {
      const { data, error } = await supabase
        .from('action_buttons')
        .update({
          deleted_at: deletedAt,
          is_active: false,
          updated_at: deletedAt,
        })
        .eq('id', linkId)
        .eq('profile_id', profileId)
        .is('deleted_at', null)
        .select('id')
        .single()

      return toResult((data as LinkIdRow | null) ?? null, error?.message ?? null)
    },
  }
}