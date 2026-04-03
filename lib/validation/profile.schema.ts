import { z } from 'zod'

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 20
export const usernameRegex = /^[a-z0-9_-]+$/

const idempotencyKeySchema = z.string().trim().min(8).max(128)
const nullableUrlSchema = z.string().transform(val => {
  const trimmed = val.trim()
  return trimmed === '' ? null : trimmed
}).nullable().optional()

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(USERNAME_MIN_LENGTH)
  .max(USERNAME_MAX_LENGTH)
  .regex(usernameRegex, 'Username can only contain lowercase letters, numbers, dashes, and underscores')

export const publicProfileLookupSchema = z.object({
  username: usernameSchema,
})

export const profileUpdateSchema = z.object({
  idempotencyKey: idempotencyKeySchema,
  updatedAt: z.string().optional(),
  username: usernameSchema.optional(),
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().max(32).optional(),
  whatsapp: z.string().trim().max(32).optional(),
  title: z.string().trim().max(80).optional(),
  company: z.string().trim().max(100).optional(),
  bio: z.string().trim().max(160).optional(),
  profileImage: nullableUrlSchema,
  bannerImage: nullableUrlSchema,
})
