'use server'

import { handleError } from '@/lib/api/handle-error'
import { ok, type ApiResponse } from '@/lib/api/response'
import { type TemplateSelectionResult, templateService } from '@/lib/services/template.service'
import { templateSelectionSchema } from '@/lib/validation/template.schema'
import { validateInput } from '@/lib/validation/validate-input'

export async function setTemplateAction(
  input: unknown
): Promise<ApiResponse<TemplateSelectionResult>> {
  try {
    const parsed = validateInput(templateSelectionSchema, input)
    const result = await templateService.setSelectedTemplate(parsed)
    return ok(result)
  } catch (error) {
    return handleError(error, {
      context: { action: 'setTemplateAction' },
    })
  }
}
