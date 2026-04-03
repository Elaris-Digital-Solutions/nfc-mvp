'use server'

import { handleError } from '@/lib/api/handle-error'
import { ok, type ApiResponse } from '@/lib/api/response'
import { type FrontendProfile } from '@/lib/mappers/profile.mapper'
import { profileService } from '@/lib/services/profile.service'
import { profileUpdateSchema, publicProfileLookupSchema } from '@/lib/validation/profile.schema'
import { validateInput } from '@/lib/validation/validate-input'

export async function updateProfileAction(input: unknown): Promise<ApiResponse<FrontendProfile>> {
  try {
    const parsed = validateInput(profileUpdateSchema, input)
    const result = await profileService.updateProfile(parsed)
    return ok(result)
  } catch (error) {
    return handleError(error, {
      context: { action: 'updateProfileAction' },
    })
  }
}

export async function getPublicProfileByUsernameAction(
  input: unknown
): Promise<ApiResponse<FrontendProfile>> {
  try {
    const parsed = validateInput(publicProfileLookupSchema, input)
    const result = await profileService.getProfileByUsername(parsed)
    return ok(result)
  } catch (error) {
    return handleError(error, {
      context: { action: 'getPublicProfileByUsernameAction' },
    })
  }
}
