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
import type { ActionButtonUpdate } from '@/lib/repositories/links/links.repository'
import { createSupabaseLinksRepository } from '@/lib/repositories/links/supabase-links.repository'
import { createLinkSchema, deleteLinkSchema, updateLinkSchema } from '@/lib/validation/links.schema'
import {
  buildIdempotencyStorageKey,
  enforceWriteLimit,
  getIdempotentResult,
  setIdempotentResult,
} from '@/lib/services/internal/operation-guards'

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
    const repository = await createSupabaseLinksRepository()
    const { data, error } = await repository.listActiveByProfileId(user.id)

    if (error) {
      throw new AppError('Failed to fetch links', 'INTERNAL_ERROR', { detail: error })
    }

    return (data ?? []).map((row) => toFrontendLink(row))
  },

  async createLink(input: CreateLinkInput): Promise<FrontendLink> {
    const user = await requireAuth()
    const operation = 'links.create'

    await enforceWriteLimit(user.id, operation)

    const idempotencyStorageKey = buildIdempotencyStorageKey(user.id, operation, input.idempotencyKey)
    const cached = await getIdempotentResult<FrontendLink>(idempotencyStorageKey)
    if (cached) {
      return cached
    }

    const repository = await createSupabaseLinksRepository()
    const { data: activeCount, error: countError } = await repository.countActiveByProfileId(user.id)

    if (countError) {
      throw new AppError('Failed to validate link quota', 'INTERNAL_ERROR', {
        detail: countError,
      })
    }

    if ((activeCount ?? 0) >= MAX_ACTIVE_LINKS) {
      throw new AppError('Maximum 6 links allowed', 'CONFLICT')
    }

    const payload = toBackendLinkInsert(
      user.id,
      {
        title: input.title,
        url: input.url,
        icon: input.icon ?? 'link',
      } as FrontendLinkInput,
      activeCount ?? 0
    )
    payload.updated_at = new Date().toISOString()

    const { data: created, error: createError } = await repository.insert(payload)

    if (createError) {
      if (createError.toLowerCase().includes('maximum 6 active links')) {
        throw new AppError('Maximum 6 links allowed', 'CONFLICT')
      }

      throw new AppError('Failed to create link', 'INTERNAL_ERROR', {
        detail: createError,
      })
    }

    if (!created) {
      throw new AppError('Failed to create link', 'INTERNAL_ERROR', {
        detail: createError,
      })
    }

    const result = toFrontendLink(created)
    await setIdempotentResult(idempotencyStorageKey, result)
    return result
  },

  async updateLink(input: UpdateLinkInput): Promise<FrontendLink> {
    const user = await requireAuth()
    const operation = 'links.update'

    await enforceWriteLimit(user.id, operation)

    const idempotencyStorageKey = buildIdempotencyStorageKey(user.id, operation, input.idempotencyKey)
    const cached = await getIdempotentResult<FrontendLink>(idempotencyStorageKey)
    if (cached) {
      return cached
    }

    const repository = await createSupabaseLinksRepository()
    const { data: current, error: currentError } = await repository.findByIdForProfile(input.id, user.id)

    if (currentError || !current || current.deleted_at) {
      throw new AppError('Link not found', 'NOT_FOUND', {
        detail: currentError,
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

    const patch: ActionButtonUpdate = {
      updated_at: new Date().toISOString(),
    }

    if (input.title !== undefined) patch.label = input.title
    if (input.url !== undefined) patch.url = input.url
    if (input.icon !== undefined) patch.icon = input.icon

    const { data: updated, error: updateError } = await repository.updateActiveByIdForProfile(
      input.id,
      user.id,
      patch,
      input.updatedAt
    )

    if (!updated && input.updatedAt) {
      throw new AppError('Link has changed. Refresh and retry.', 'CONFLICT')
    }

    if (updateError || !updated) {
      throw new AppError('Failed to update link', 'INTERNAL_ERROR', {
        detail: updateError,
      })
    }

    const result = toFrontendLink(updated)
    await setIdempotentResult(idempotencyStorageKey, result)
    return result
  },

  async deleteLink(input: DeleteLinkInput): Promise<DeleteLinkResult> {
    const user = await requireAuth()
    const operation = 'links.delete'

    await enforceWriteLimit(user.id, operation)

    const idempotencyStorageKey = buildIdempotencyStorageKey(user.id, operation, input.idempotencyKey)
    const cached = await getIdempotentResult<DeleteLinkResult>(idempotencyStorageKey)
    if (cached) {
      return cached
    }

    const repository = await createSupabaseLinksRepository()
    const deletedAt = new Date().toISOString()

    const { data, error } = await repository.softDeleteByIdForProfile(input.id, user.id, deletedAt)

    if (error || !data) {
      throw new AppError('Failed to delete link', 'INTERNAL_ERROR', {
        detail: error,
      })
    }

    const result: DeleteLinkResult = {
      id: input.id,
      deletedAt,
    }

    await setIdempotentResult(idempotencyStorageKey, result)
    return result
  },
}
