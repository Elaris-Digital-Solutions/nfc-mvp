'use client'

import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { TemplateKey } from '@/lib/mappers/template.mapper'

interface TemplateCardProps {
  id: TemplateKey
  name: string
  category: string
  description: string
  colors: {
    background: string
    cardBg: string
    text: string
    border: string
    accent: string
  }
  isSelected: boolean
  onSelect: (id: TemplateKey) => void
}

export function TemplateCard({
  id,
  name,
  category,
  description,
  colors,
  isSelected,
  onSelect,
}: TemplateCardProps) {
  const { user } = useAuth()

  return (
    <div
      className={`relative rounded-2xl border-2 transition-all ${
        isSelected
          ? 'border-white/30 ring-2 ring-white/20'
          : 'border-border/50 hover:border-border'
      }`}
    >
      {/* Preview Card */}
      <div
        style={{
          backgroundColor: colors.background,
          color: colors.text,
        }}
        className="p-6 rounded-xl mb-4"
      >
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
          }}
          className="border rounded-lg p-4"
        >
          {/* Profile Preview */}
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.profileImage} />
              <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p style={{ color: colors.text }} className="font-semibold">
                {user?.name || 'Nombre'}
              </p>
              <p style={{ color: colors.text }} className="text-sm opacity-75">
                {user?.title || 'Profesión'}
              </p>
            </div>
          </div>

          {/* Buttons Preview */}
          <div className="mt-4 space-y-2">
            <div
              style={{
                backgroundColor: colors.border,
                color: colors.text,
              }}
              className="rounded px-3 py-2 text-center text-sm font-medium"
            >
              LinkedIn
            </div>
            <div
              style={{
                backgroundColor: colors.border,
                color: colors.text,
              }}
              className="rounded px-3 py-2 text-center text-sm font-medium"
            >
              WhatsApp
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-6 pb-6 space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
            {category}
          </p>
          <h3 className="text-lg font-bold">{name}</h3>
          <p className="text-sm text-muted-foreground mt-2">{description}</p>
        </div>

        <Button
          onClick={() => onSelect(id)}
          variant={isSelected ? 'default' : 'outline'}
          className="w-full"
        >
          {isSelected ? 'SELECCIONADA' : 'APLICAR'}
        </Button>
      </div>
    </div>
  )
}
