import 'server-only'

import { z } from 'zod'

import { requireAuth } from '@/lib/api/auth'
import { AppError } from '@/lib/api/errors'
import { toTemplateId } from '@/lib/mappers/template.mapper'
import { createSupabaseTemplateRepository } from '@/lib/repositories/template/supabase-template.repository'
import { templateSelectionSchema } from '@/lib/validation/template.schema'
import {
  buildIdempotencyStorageKey,
  enforceWriteLimit,
  getIdempotentResult,
  setIdempotentResult,
} from '@/lib/services/internal/operation-guards'

type TemplateSelectionInput = z.infer<typeof templateSelectionSchema>

export type TemplateSelectionResult = {
  selectedTemplate: TemplateSelectionInput['selectedTemplate']
  updatedAt: string
}

const TEMPLATE_UPDATE_OPERATION = 'template.update'

export const templateService = {
  async setSelectedTemplate(input: TemplateSelectionInput): Promise<TemplateSelectionResult> {
    const user = await requireAuth()
    enforceWriteLimit(user.id, TEMPLATE_UPDATE_OPERATION)

    const idempotencyStorageKey = buildIdempotencyStorageKey(
      user.id,
      TEMPLATE_UPDATE_OPERATION,
      input.idempotencyKey
    )

    const cached = getIdempotentResult<TemplateSelectionResult>(idempotencyStorageKey)
    if (cached) {
      return cached
    }

    const repository = await createSupabaseTemplateRepository()
    const { data: currentProfile, error: currentError } = await repository.findById(user.id)

    if (currentError || !currentProfile || currentProfile.deleted_at) {
      throw new AppError('Profile not found', 'NOT_FOUND', {
        detail: currentError,
      })
    }

    if (
      input.updatedAt &&
      currentProfile.updated_at &&
      new Date(input.updatedAt).getTime() < new Date(currentProfile.updated_at).getTime()
    ) {
      throw new AppError('Template selection is stale. Refresh and retry.', 'CONFLICT')
    }

    const now = new Date().toISOString()

    const { data: updatedProfile, error: updateError } = await repository.updateTemplateById(
      user.id,
      toTemplateId(input.selectedTemplate),
      now
    )

    if (updateError || !updatedProfile) {
      throw new AppError('Failed to update template', 'INTERNAL_ERROR', {
        detail: updateError,
      })
    }

    const result: TemplateSelectionResult = {
      selectedTemplate: input.selectedTemplate,
      updatedAt: updatedProfile.updated_at ?? now,
    }

    setIdempotentResult(idempotencyStorageKey, result)
    return result
  },
}
