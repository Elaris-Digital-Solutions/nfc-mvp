import { z } from 'zod'

export const templateSelectionSchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(128),
  updatedAt: z.string().optional(),
  selectedTemplate: z.enum(['minimal-black']),
})
