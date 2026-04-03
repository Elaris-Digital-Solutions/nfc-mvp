export const TEMPLATE_TO_ID = {
  'minimal-black': 1,
} as const

export type TemplateKey = keyof typeof TEMPLATE_TO_ID

const ID_TO_TEMPLATE: Record<number, TemplateKey> = {
  1: 'minimal-black',
}

export function toTemplateId(template: TemplateKey): number {
  return TEMPLATE_TO_ID[template]
}

export function toTemplateKey(templateId: number): TemplateKey {
  return ID_TO_TEMPLATE[templateId] ?? 'minimal-black'
}
