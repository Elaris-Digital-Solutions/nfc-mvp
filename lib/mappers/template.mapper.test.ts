import { describe, expect, it } from 'vitest'

import { toTemplateId, toTemplateKey } from './template.mapper'

describe('template.mapper', () => {
  it('maps template key to id', () => {
    expect(toTemplateId('minimal-black')).toBe(1)
  })

  it('maps known id to template key', () => {
    expect(toTemplateKey(1)).toBe('minimal-black')
  })

  it('falls back to default key for unknown ids', () => {
    expect(toTemplateKey(999)).toBe('minimal-black')
  })
})