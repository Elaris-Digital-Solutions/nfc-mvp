'use client'

import { useAuth } from '@/lib/auth-context'
import { TemplateCard } from './template-card'
import { TEMPLATES } from '@/lib/constants'

export function TemplateGrid() {
  const { user, updateProfile } = useAuth()

  const handleSelectTemplate = (templateId: string) => {
    updateProfile({
      selectedTemplate: templateId as any,
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Object.entries(TEMPLATES).map(([key, template]) => (
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
