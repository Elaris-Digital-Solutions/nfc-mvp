import { z } from 'zod'

const idempotencyKeySchema = z.string().trim().min(8).max(128)

export const linkIconSchema = z.enum(['instagram', 'linkedin', 'whatsapp', 'website', 'link'])

export const createLinkSchema = z.object({
  idempotencyKey: idempotencyKeySchema,
  title: z.string().trim().min(1).max(80),
  url: z.string().trim().url(),
  icon: linkIconSchema.default('link'),
})

export const updateLinkSchema = z
  .object({
    idempotencyKey: idempotencyKeySchema,
    id: z.string().uuid(),
    updatedAt: z.string().optional(),
    title: z.string().trim().min(1).max(80).optional(),
    url: z.string().trim().url().optional(),
    icon: linkIconSchema.optional(),
  })
  .superRefine((value, context) => {
    if (!value.title && !value.url && !value.icon) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one field must be provided to update a link',
      })
    }
  })

export const deleteLinkSchema = z.object({
  idempotencyKey: idempotencyKeySchema,
  id: z.string().uuid(),
})
