'use client'

import { useAuth } from '@/lib/auth-context'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { TEMPLATES } from '@/lib/constants'
import { Download, Linkedin, MessageCircle, Globe, Instagram } from 'lucide-react'

export function LinktreeCard() {
  const { user } = useAuth()
  const selectedTemplate = user?.selectedTemplate || 'mono-sharp'
  const template = TEMPLATES[selectedTemplate as keyof typeof TEMPLATES]

  if (!template) return null

  const socialIcons: Record<string, React.ReactNode> = {
    linkedin: <Linkedin className="w-5 h-5" />,
    whatsapp: <MessageCircle className="w-5 h-5" />,
    instagram: <Instagram className="w-5 h-5" />,
    website: <Globe className="w-5 h-5" />,
  }

  return (
    <div
      style={{ backgroundColor: template.colors.background }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div
        style={{
          backgroundColor: template.colors.cardBg,
          borderColor: template.colors.border,
          color: template.colors.text,
        }}
        className="w-full max-w-md rounded-2xl border p-8 space-y-6"
      >
        {/* Profile Section */}
        <div className="flex flex-col items-center gap-4 text-center">
          <Avatar className="h-24 w-24 border-4" style={{ borderColor: template.colors.accent }}>
            <AvatarImage src={user?.profileImage} />
            <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">{user?.name}</h1>
            <p style={{ color: template.colors.accent }} className="text-sm font-medium mt-2">
              {user?.title || 'Profesional'}
            </p>
            <p className="text-xs opacity-75 mt-1">{user?.company || ''}</p>
          </div>

          {user?.bio && (
            <p className="text-sm leading-relaxed">{user.bio}</p>
          )}
        </div>

        {/* Action Button */}
        <Button
          className="w-full"
          style={{
            backgroundColor: template.colors.accent,
            color: template.colors.background,
          }}
        >
          <Download className="w-4 h-4 mr-2" />
          SINCRONIZAR CONTACTO
        </Button>

        {/* Links Section */}
        <div className="space-y-3">
          {user?.links?.map((link) => (
            <a
              key={link.id}
              href={link.url || '#'}
              style={{
                borderColor: template.colors.border,
                color: template.colors.text,
              }}
              className="flex items-center gap-3 p-4 rounded-lg border hover:opacity-80 transition-opacity"
            >
              {socialIcons[link.icon] || <Globe className="w-5 h-5" />}
              <span className="font-medium flex-1">{link.title}</span>
              <span className="text-lg">→</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
