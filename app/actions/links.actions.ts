'use server'

import { handleError } from '@/lib/api/handle-error'
import { ok, type ApiResponse } from '@/lib/api/response'
import { type FrontendLink } from '@/lib/mappers/profile.mapper'
import { linksService } from '@/lib/services/links.service'
import { createLinkSchema, deleteLinkSchema, updateLinkSchema } from '@/lib/validation/links.schema'
import { validateInput } from '@/lib/validation/validate-input'

type DeleteLinkResult = {
  id: string
  deletedAt: string
}

export async function listLinksAction(): Promise<ApiResponse<FrontendLink[]>> {
  try {
    const result = await linksService.listActiveLinks()
    return ok(result)
  } catch (error) {
    return handleError(error, {
      context: { action: 'listLinksAction' },
    })
  }
}

export async function createLinkAction(input: unknown): Promise<ApiResponse<FrontendLink>> {
  try {
    const parsed = validateInput(createLinkSchema, input)
    const result = await linksService.createLink(parsed)
    return ok(result)
  } catch (error) {
    return handleError(error, {
      context: { action: 'createLinkAction' },
    })
  }
}

export async function updateLinkAction(input: unknown): Promise<ApiResponse<FrontendLink>> {
  try {
    const parsed = validateInput(updateLinkSchema, input)
    const result = await linksService.updateLink(parsed)
    return ok(result)
  } catch (error) {
    return handleError(error, {
      context: { action: 'updateLinkAction' },
    })
  }
}

export async function deleteLinkAction(input: unknown): Promise<ApiResponse<DeleteLinkResult>> {
  try {
    const parsed = validateInput(deleteLinkSchema, input)
    const result = await linksService.deleteLink(parsed)
    return ok(result)
  } catch (error) {
    return handleError(error, {
      context: { action: 'deleteLinkAction' },
    })
  }
}
