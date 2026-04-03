import 'server-only'

import { z } from 'zod'

import { requireAuth } from '@/lib/api/auth'
import { AppError } from '@/lib/api/errors'
import {
  toBackendLinkInsert,
  toFrontendLink,
  type FrontendLink,
  type FrontendLinkInput,
} from '@/lib/mappers/profile.mapper'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createLinkSchema, deleteLinkSchema, updateLinkSchema } from '@/lib/validation/links.schema'
import {
  buildIdempotencyStorageKey,
  enforceWriteLimit,
  getIdempotentResult,
  setIdempotentResult,
} from '@/lib/services/internal/operation-guards'
import type { Database } from '@/types/database'

type ActionButtonRow = Database['public']['Tables']['action_buttons']['Row']
type CreateLinkInput = z.infer<typeof createLinkSchema>
type UpdateLinkInput = z.infer<typeof updateLinkSchema>
type DeleteLinkInput = z.infer<typeof deleteLinkSchema>

type DeleteLinkResult = {
  id: string
  deletedAt: string
}

const MAX_ACTIVE_LINKS = 6

export const linksService = {
  async listActiveLinks(): Promise<FrontendLink[]> {
    const user = await requireAuth()
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('action_buttons')
      .select('*')
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })

    if (error) {
      throw new AppError('Failed to fetch links', 'INTERNAL_ERROR', { detail: error.message })
    }

    return (data ?? []).map((row) => toFrontendLink(row as ActionButtonRow))
  },

  async createLink(input: CreateLinkInput): Promise<FrontendLink> {
    const user = await requireAuth()
    const operation = 'links.create'

    enforceWriteLimit(user.id, operation)

    const idempotencyStorageKey = buildIdempotencyStorageKey(user.id, operation, input.idempotencyKey)
    const cached = getIdempotentResult<FrontendLink>(idempotencyStorageKey)
    if (cached) {
      return cached
    }

    const supabase = await createServerSupabaseClient()
    const { count, error: countError } = await supabase
      .from('action_buttons')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .is('deleted_at', null)

    if (countError) {
      throw new AppError('Failed to validate link quota', 'INTERNAL_ERROR', {
        detail: countError.message,
      })
    }

    if ((count ?? 0) >= MAX_ACTIVE_LINKS) {
      throw new AppError('Maximum 6 links allowed', 'CONFLICT')
    }

    const payload = toBackendLinkInsert(
      user.id,
      {
        title: input.title,
        url: input.url,
        icon: input.icon ?? 'link',
      } as FrontendLinkInput,
      count ?? 0
    )
    payload.updated_at = new Date().toISOString()

    const { data: created, error: createError } = await supabase
      .from('action_buttons')
      .insert(payload)
      .select('*')
      .single()

    if (createError || !created) {
      throw new AppError('Failed to create link', 'INTERNAL_ERROR', {
        detail: createError?.message,
      })
    }

    const result = toFrontendLink(created as ActionButtonRow)
    setIdempotentResult(idempotencyStorageKey, result)
    return result
  },

  async updateLink(input: UpdateLinkInput): Promise<FrontendLink> {
    const user = await requireAuth()
    const operation = 'links.update'

    enforceWriteLimit(user.id, operation)

    const idempotencyStorageKey = buildIdempotencyStorageKey(user.id, operation, input.idempotencyKey)
    const cached = getIdempotentResult<FrontendLink>(idempotencyStorageKey)
    if (cached) {
      return cached
    }

    const supabase = await createServerSupabaseClient()
    const { data: current, error: currentError } = await supabase
      .from('action_buttons')
      .select('*')
      .eq('id', input.id)
      .eq('profile_id', user.id)
      .single()

    if (currentError || !current || current.deleted_at) {
      throw new AppError('Link not found', 'NOT_FOUND', {
        detail: currentError?.message,
      })
    }

    const currentVersion = current.updated_at ?? current.created_at
    if (
      input.updatedAt &&
      currentVersion &&
      new Date(input.updatedAt).getTime() < new Date(currentVersion).getTime()
    ) {
      throw new AppError('Link has changed. Refresh and retry.', 'CONFLICT')
    }

    const patch: Database['public']['Tables']['action_buttons']['Update'] = {
      updated_at: new Date().toISOString(),
    }

    if (input.title !== undefined) patch.label = input.title
    if (input.url !== undefined) patch.url = input.url
    if (input.icon !== undefined) patch.icon = input.icon

    const { data: updated, error: updateError } = await supabase
      .from('action_buttons')
      .update(patch)
      .eq('id', input.id)
      .eq('profile_id', user.id)
      .is('deleted_at', null)
      .select('*')
      .single()

    if (updateError || !updated) {
      throw new AppError('Failed to update link', 'INTERNAL_ERROR', {
        detail: updateError?.message,
      })
    }

    const result = toFrontendLink(updated as ActionButtonRow)
    setIdempotentResult(idempotencyStorageKey, result)
    return result
  },

  async deleteLink(input: DeleteLinkInput): Promise<DeleteLinkResult> {
    const user = await requireAuth()
    const operation = 'links.delete'

    enforceWriteLimit(user.id, operation)

    const idempotencyStorageKey = buildIdempotencyStorageKey(user.id, operation, input.idempotencyKey)
    const cached = getIdempotentResult<DeleteLinkResult>(idempotencyStorageKey)
    if (cached) {
      return cached
    }

    const supabase = await createServerSupabaseClient()
    const deletedAt = new Date().toISOString()

    const { data, error } = await supabase
      .from('action_buttons')
      .update({
        deleted_at: deletedAt,
        is_active: false,
        updated_at: deletedAt,
      })
      .eq('id', input.id)
      .eq('profile_id', user.id)
      .is('deleted_at', null)
      .select('id')
      .single()

    if (error || !data) {
      throw new AppError('Failed to delete link', 'INTERNAL_ERROR', {
        detail: error?.message,
      })
    }

    const result: DeleteLinkResult = {
      id: input.id,
      deletedAt,
    }

    setIdempotentResult(idempotencyStorageKey, result)
    return result
  },
}
