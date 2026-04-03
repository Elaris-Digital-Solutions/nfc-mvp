import 'server-only'

import { z } from 'zod'

import { requireAuth } from '@/lib/api/auth'
import { AppError } from '@/lib/api/errors'
import { toBackendProfile, toFrontendProfile, type FrontendProfile } from '@/lib/mappers/profile.mapper'
import { createSupabaseProfileRepository } from '@/lib/repositories/profile/supabase-profile.repository'
import { profileUpdateSchema, publicProfileLookupSchema } from '@/lib/validation/profile.schema'
import {
  buildIdempotencyStorageKey,
  enforceWriteLimit,
  getIdempotentResult,
  setIdempotentResult,
} from '@/lib/services/internal/operation-guards'

type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
type PublicProfileLookupInput = z.infer<typeof publicProfileLookupSchema>

const PROFILE_UPDATE_OPERATION = 'profile.update'

function isTrustedCloudinaryUrl(url: string | null | undefined): boolean {
  if (!url) return true

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim()
  if (!cloudName) {
    return false
  }

  return url.startsWith(`https://res.cloudinary.com/${cloudName}/`)
}

export const profileService = {
  async updateProfile(input: ProfileUpdateInput): Promise<FrontendProfile> {
    const user = await requireAuth()
    enforceWriteLimit(user.id, PROFILE_UPDATE_OPERATION)

    const idempotencyStorageKey = buildIdempotencyStorageKey(
      user.id,
      PROFILE_UPDATE_OPERATION,
      input.idempotencyKey
    )

    const cachedResult = getIdempotentResult<FrontendProfile>(idempotencyStorageKey)
    if (cachedResult) {
      return cachedResult
    }

    if (!isTrustedCloudinaryUrl(input.profileImage) || !isTrustedCloudinaryUrl(input.bannerImage)) {
      throw new AppError('Invalid image URL', 'INVALID_INPUT', {
        profileImage: input.profileImage,
        bannerImage: input.bannerImage,
      })
    }

    const repository = await createSupabaseProfileRepository()
    const { data: currentProfile, error: currentError } = await repository.findById(user.id)

    if (currentError || !currentProfile) {
      throw new AppError('Profile not found', 'NOT_FOUND', {
        detail: currentError,
      })
    }

    if (currentProfile.deleted_at) {
      throw new AppError('Profile is inactive', 'NOT_FOUND')
    }

    if (
      input.updatedAt &&
      currentProfile.updated_at &&
      new Date(input.updatedAt).getTime() < new Date(currentProfile.updated_at).getTime()
    ) {
      throw new AppError('Profile has changed. Refresh and retry.', 'CONFLICT')
    }

    if (input.username) {
      const { data: conflictProfile, error: conflictError } = await repository.findUsernameConflict(
        input.username,
        user.id
      )

      if (conflictError) {
        throw new AppError('Failed to validate username uniqueness', 'INTERNAL_ERROR', {
          detail: conflictError,
        })
      }

      if (conflictProfile) {
        throw new AppError('Username is already in use', 'CONFLICT')
      }
    }

    const { idempotencyKey, updatedAt, ...profilePayload } = input
    void idempotencyKey
    void updatedAt

    const mappedUpdate = toBackendProfile(profilePayload)
    mappedUpdate.updated_at = new Date().toISOString()

    const { data: updatedProfile, error: updateError } = await repository.updateById(
      user.id,
      mappedUpdate
    )

    if (updateError || !updatedProfile) {
      throw new AppError('Failed to update profile', 'INTERNAL_ERROR', {
        detail: updateError,
      })
    }

    const { data: links, error: linksError } = await repository.listActiveLinks(user.id)

    if (linksError) {
      throw new AppError('Failed to fetch profile links', 'INTERNAL_ERROR', {
        detail: linksError,
      })
    }

    const result = toFrontendProfile(updatedProfile, links ?? [])
    setIdempotentResult(idempotencyStorageKey, result)
    return result
  },

  async getProfileByUsername(input: PublicProfileLookupInput): Promise<FrontendProfile> {
    const normalizedUsername = input.username.trim().toLowerCase()
    const repository = await createSupabaseProfileRepository()

    const { data: profile, error: profileError } = await repository.findByUsername(normalizedUsername)

    if (profileError || !profile || !profile.is_active || profile.deleted_at) {
      throw new AppError('Profile not found', 'NOT_FOUND', {
        detail: profileError,
      })
    }

    const { data: links, error: linksError } = await repository.listActiveLinks(profile.id)

    if (linksError) {
      throw new AppError('Failed to fetch profile links', 'INTERNAL_ERROR', {
        detail: linksError,
      })
    }

    return toFrontendProfile(profile, links ?? [])
  },
}
