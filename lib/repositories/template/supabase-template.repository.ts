import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type {
  RepositoryResult,
  TemplateProfileSnapshot,
  TemplateRepository,
  TemplateUpdateSnapshot,
} from '@/lib/repositories/template/template.repository'

function toResult<T>(data: T | null, error: string | null): RepositoryResult<T> {
  return { data, error }
}

export async function createSupabaseTemplateRepository(): Promise<TemplateRepository> {
  const supabase = await createServerSupabaseClient()

  return {
    async findById(profileId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, updated_at, deleted_at')
        .eq('id', profileId)
        .single()

      return toResult((data as TemplateProfileSnapshot | null) ?? null, error?.message ?? null)
    },

    async updateTemplateById(profileId, templateId, updatedAt, expectedUpdatedAt) {
      let query = supabase
        .from('profiles')
        .update({
          template_id: templateId,
          updated_at: updatedAt,
        })
        .eq('id', profileId)

      if (expectedUpdatedAt) {
        query = query.eq('updated_at', expectedUpdatedAt)
      }

      const { data, error } = await query
        .select('updated_at')
        .single()

      return toResult((data as TemplateUpdateSnapshot | null) ?? null, error?.message ?? null)
    },
  }
}