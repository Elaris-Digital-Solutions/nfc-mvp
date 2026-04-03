'use client'

import { useAuth } from '@/lib/auth-context'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { TEMPLATES } from '@/lib/constants'
import { Download, ExternalLink, Globe, Instagram, Linkedin, MessageCircle } from 'lucide-react'
import { montserrat } from '@/lib/fonts'

export function LinktreeCard() {
  const { user } = useAuth()
  const selectedTemplate = user?.selectedTemplate || 'mono-sharp'
  const template = TEMPLATES[selectedTemplate as keyof typeof TEMPLATES]

  if (!template) return null

  const socialIcons: Record<string, JSX.Element> = {
    linkedin: <Linkedin className="w-5 h-5" />,
    whatsapp: <MessageCircle className="w-5 h-5" />,
    instagram: <Instagram className="w-5 h-5" />,
    website: <Globe className="w-5 h-5" />,
  }

  const isLightTemplate = template.textStyle === 'dark'
  const visibleLinks = user?.links?.length
    ? user.links.slice(0, 6)
    : [
        { id: '1', title: 'Sigueme en Instagram', url: '', icon: 'instagram' },
        { id: '2', title: 'Conectemos en Linkedin', url: '', icon: 'linkedin' },
        { id: '3', title: 'Elaris Digital Solutions', url: '', icon: 'website' },
      ]

  return (
    <div
      style={{ backgroundColor: template.colors.background }}
      className={`${montserrat.className} min-h-screen flex items-start justify-center px-4 py-6 md:py-8`}
    >
      <div
        style={{
          backgroundColor: isLightTemplate ? '#f8fbff' : '#04070d',
          borderColor: template.colors.border,
          color: template.colors.text,
        }}
        className="w-full max-w-[390px] md:max-w-[430px] overflow-hidden rounded-[28px] border shadow-[0_20px_70px_-30px_rgba(0,0,0,0.8)]"
      >
        <div className="relative h-28 md:h-32 w-full overflow-visible">
          <div className="absolute inset-0 overflow-hidden rounded-t-[28px]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/tarjeta.jpeg')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/30 to-black/75" />
            <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_10%,rgba(255,255,255,0.18),transparent_65%)]" />
          </div>

          <Avatar className="absolute z-20 left-1/2 bottom-0 h-24 w-24 -translate-x-1/2 translate-y-[52%] rounded-3xl border-4 border-black/70 shadow-xl">
            <AvatarImage src={user?.profileImage || '/placeholder-user.jpg'} />
            <AvatarFallback className="rounded-3xl text-xl font-bold bg-white text-black">
              {user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="px-6 pb-6 pt-14 md:px-7 text-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-[1.02]">
              {user?.name || 'Usuario Principal'}
            </h1>
            <p className="mt-1.5 text-xl md:text-2xl font-semibold" style={{ color: isLightTemplate ? '#1a2435' : '#e4e8f0' }}>
              {user?.title || 'Gerente'}
            </p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-[0.08em]" style={{ color: isLightTemplate ? '#3a475c' : '#9ba7bf' }}>
              {user?.company || 'ELARIS S.A.C.S'}
            </p>
          </div>

          {user?.bio && (
            <p className="mt-3.5 text-sm md:text-base leading-relaxed" style={{ color: isLightTemplate ? '#3a475c' : '#b7c1d4' }}>
              {user.bio}
            </p>
          )}

          <Button
            className="mt-5 h-10 w-full rounded-xl font-semibold tracking-[0.1em] uppercase text-sm"
            style={{
              backgroundColor: isLightTemplate ? '#101b2e' : '#f2f5f9',
              color: isLightTemplate ? '#f4f7fb' : '#111827',
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Sincronizar contacto
          </Button>

          <div className="mt-4 space-y-2.5 text-left">
            {visibleLinks.map((link) => (
              <a
                key={link.id}
                href={link.url || '#'}
                target={link.url ? '_blank' : undefined}
                rel={link.url ? 'noopener noreferrer' : undefined}
                style={{
                  borderColor: isLightTemplate ? '#d0dceb' : template.colors.border,
                  backgroundColor: isLightTemplate ? '#ffffff' : '#060a12',
                  color: isLightTemplate ? '#1a2435' : template.colors.text,
                }}
                className="group flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:bg-white/[0.04]"
              >
                <span className="opacity-85">{socialIcons[link.icon] || <Globe className="w-5 h-5" />}</span>
                <span className="font-semibold text-base flex-1">{link.title || 'Nuevo enlace'}</span>
                <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
