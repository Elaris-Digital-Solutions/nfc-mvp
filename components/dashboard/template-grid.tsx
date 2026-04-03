'use client'

import { useAuth } from '@/lib/auth-context'
import { TemplateCard } from './template-card'
import { TEMPLATES } from '@/lib/constants'
import type { TemplateKey } from '@/lib/mappers/template.mapper'

export function TemplateGrid() {
  const { user, updateProfile } = useAuth()

  const handleSelectTemplate = (templateId: TemplateKey) => {
    updateProfile({
      selectedTemplate: templateId,
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {(Object.entries(TEMPLATES) as Array<[TemplateKey, (typeof TEMPLATES)[TemplateKey]]>).map(([key, template]) => (
        <TemplateCard
          key={key}
          id={key}
          name={template.name}
          category={template.category}
          description={template.description}
          colors={template.colors}
          isSelected={user?.selectedTemplate === key}
          onSelect={handleSelectTemplate}
        />
      ))}
    </div>
  )
}
