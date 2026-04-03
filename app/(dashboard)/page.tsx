'use client'

import { useState } from 'react'
import { Home, Save, Sparkles, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/shared/sidebar'
import { useAuth } from '@/lib/auth-context'
import { TEMPLATES } from '@/lib/constants'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type DashboardSection = 'inicio' | 'perfil' | 'botones' | 'plantilla'

export default function DashboardPage() {
  const { user, updateProfile } = useAuth()
  const [activeSection, setActiveSection] = useState<DashboardSection>('inicio')
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    title: user?.title || '',
    company: user?.company || '',
    email: user?.email || '',
    phone: user?.phone || '',
    whatsapp: user?.whatsapp || '',
    bio: user?.bio || '',
  })
  const [links, setLinks] = useState(
    user?.links?.length
      ? user.links
      : [
          { id: '1', title: 'Sigueme en Instagram', url: '', icon: 'instagram' },
          { id: '2', title: 'Conectemos en Linkedin', url: '', icon: 'linkedin' },
          { id: '3', title: 'Elaris Digital Solutions', url: '', icon: 'website' },
        ],
  )

  const handleProfileSave = () => {
    updateProfile(profileForm)
  }

  const handleTemplateSelect = (templateId: string) => {
    updateProfile({ selectedTemplate: templateId as any })
  }

  const selectedTemplateKey = ((user?.selectedTemplate as keyof typeof TEMPLATES) || 'minimal-black') as keyof typeof TEMPLATES
  const activeTemplate = TEMPLATES[selectedTemplateKey] ?? TEMPLATES['minimal-black']

  const updateLink = (id: string, field: 'title' | 'url' | 'icon', value: string) => {
    setLinks((prev) => prev.map((link) => (link.id === id ? { ...link, [field]: value } : link)))
  }

  const addLink = () => {
    if (links.length >= 6) return
    setLinks((prev) => [...prev, { id: crypto.randomUUID(), title: '', url: '', icon: 'website' }])
  }

  const saveLinks = () => {
    updateProfile({ links })
  }

  const InicioSection = (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black tracking-tight">Panel de usuario</h1>
        <p className="mt-1.5 text-muted-foreground text-lg">
          Gestiona tu perfil, enlaces y plantilla desde el menu lateral.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/60 p-4">
          <h3 className="text-2xl font-bold">Perfil</h3>
          <p className="text-muted-foreground mt-1.5 text-base">Actualiza datos profesionales y contacto.</p>
        </div>
        <div className="rounded-xl border border-border/60 p-4">
          <h3 className="text-2xl font-bold">Botones</h3>
          <p className="text-muted-foreground mt-1.5 text-base">Configura enlaces y orden de acciones.</p>
        </div>
        <div className="rounded-xl border border-border/60 p-4">
          <h3 className="text-2xl font-bold">Plantilla</h3>
          <p className="text-muted-foreground mt-1.5 text-base">Elige el estilo visual de tu tarjeta.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 p-4">
        <p className="text-sm tracking-[0.2em] uppercase font-semibold">Siguiente paso</p>
        <p className="text-muted-foreground mt-2 text-base">
          Completa tu perfil y agrega al menos un boton para publicar una tarjeta utilizable.
        </p>
      </div>
    </div>
  )

  const PerfilSection = (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black tracking-tight">Mi perfil</h1>
        <p className="mt-1.5 text-muted-foreground text-lg">Configura la informacion publica y de contacto.</p>
      </div>

      <div className="rounded-xl border border-border/60 p-4 space-y-4">
        <p className="text-sm tracking-[0.2em] uppercase font-semibold">Identidad visual</p>
        <div className="relative rounded-lg border border-border/60 p-3 md:p-4 pb-10 overflow-visible bg-card">
          <div className="relative h-32 md:h-40 w-full rounded-lg border border-primary/40 bg-gradient-to-r from-white/70 via-[#22324e] to-[#0d1f3c] shadow-inner">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="absolute z-10 bottom-3 left-24 md:left-32 h-8 rounded-md border-border/70 bg-background/95 text-foreground hover:bg-background"
            >
              Subir foto de perfil
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="absolute z-10 bottom-3 right-3 h-8 rounded-md border-border/70 bg-background/95 text-foreground hover:bg-background"
            >
              Agregar foto de portada
            </Button>
          </div>

          <Avatar className="absolute z-20 -bottom-0 left-10 h-20 w-20 rounded-xl border-4 border-background shadow-xl">
            <AvatarImage src={user?.profileImage} />
            <AvatarFallback className="rounded-xl text-lg font-bold bg-white text-black">
              {user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 p-4 space-y-4">
        <p className="text-sm tracking-[0.2em] uppercase font-semibold">Informacion de contacto</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              value={profileForm.name}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Cargo</Label>
            <Input
              id="title"
              value={profileForm.title}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Input
              id="company"
              value={profileForm.company}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, company: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefono</Label>
            <Input
              id="phone"
              value={profileForm.phone}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={profileForm.whatsapp}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bio">Biografia</Label>
            <textarea
              id="bio"
              value={profileForm.bio}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleProfileSave} className="px-6">
          <Save className="w-4 h-4 mr-2" />
          Guardar cambios
        </Button>
      </div>
    </div>
  )

  const BotonesSection = (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/60 p-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Mis botones</h1>
          <p className="mt-1.5 text-muted-foreground text-lg">Gestiona los botones que se muestran en tu perfil publico.</p>
        </div>
        <span className="text-sm border border-border rounded-md px-3 py-1 font-semibold">{links.length} / 6</span>
      </div>

      <div className="space-y-3">
        {links.map((link, idx) => (
          <div key={link.id} className="rounded-xl border border-border/60 p-4 space-y-3">
            <p className="text-sm tracking-[0.2em] uppercase font-semibold">Boton #{idx + 1}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Etiqueta</Label>
                <Input value={link.title} onChange={(e) => updateLink(link.id, 'title', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input value={link.url} onChange={(e) => updateLink(link.id, 'url', e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Icono</Label>
                <select
                  value={link.icon}
                  onChange={(e) => updateLink(link.id, 'icon', e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                >
                  <option value="instagram">instagram</option>
                  <option value="linkedin">linkedin</option>
                  <option value="whatsapp">whatsapp</option>
                  <option value="website">website</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 rounded-xl border border-border/60 bg-background/90 backdrop-blur p-3 flex items-center justify-between gap-3">
        <Button variant="outline" onClick={addLink}>+ Anadir boton</Button>
        <Button onClick={saveLinks} className="px-6">
          <Save className="w-4 h-4 mr-2" />
          Guardar cambios
        </Button>
      </div>
    </div>
  )

  const PlantillaSection = (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.04),rgba(16,34,63,0.08))] p-5 md:p-8">
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-48 w-48 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground tracking-[0.2em] uppercase">Direccion visual</span>
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Plantillas</h1>
            <p className="mt-2 text-muted-foreground text-lg">
              Elige una identidad visual para tu tarjeta. Cada plantilla cambia ritmo, contraste y personalidad de tu perfil publico.
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 md:min-w-48">
            <p className="text-xs text-muted-foreground tracking-[0.18em] uppercase">Plantilla activa</p>
            <p className="mt-1 text-2xl font-bold">{activeTemplate.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Object.entries(TEMPLATES).map(([id, template]) => {
          const isSelected = user?.selectedTemplate === id
          const isLight = template.textStyle === 'dark'
          return (
            <div
              key={id}
              className={`rounded-2xl border p-4 transition-all ${
                isSelected
                  ? 'border-white/70 bg-white/[0.06] shadow-[0_0_0_1px_rgba(255,255,255,0.35)]'
                  : 'border-border/60 bg-background/50 hover:border-border hover:bg-background/70'
              }`}
            >
              <div
                style={{ backgroundColor: template.colors.background }}
                className="rounded-xl border border-white/10 p-3"
              >
                <div
                  style={{
                    backgroundColor: template.colors.cardBg,
                    borderColor: template.colors.border,
                  }}
                  className="rounded-lg border p-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      style={{ borderColor: template.colors.border }}
                      className={`h-10 w-10 rounded-full border ${isLight ? 'bg-black/5' : 'bg-white/5'}`}
                    />
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isLight ? 'text-black' : 'text-white'}`}>
                        {user?.name || 'Fabrizio Bussalleu'}
                      </p>
                      <p className={`text-xs truncate ${isLight ? 'text-black/60' : 'text-white/70'}`}>
                        {user?.title || 'Consultor Comercial'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div
                      style={{ borderColor: template.colors.border }}
                      className={`h-8 rounded-md border px-3 flex items-center text-xs font-semibold ${isLight ? 'text-black/70 bg-black/5' : 'text-white/80 bg-white/5'}`}
                    >
                      LinkedIn
                    </div>
                    <div
                      style={{ borderColor: template.colors.border }}
                      className={`h-8 rounded-md border px-3 flex items-center text-xs font-semibold ${isLight ? 'text-black/70 bg-black/5' : 'text-white/80 bg-white/5'}`}
                    >
                      WhatsApp
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="inline-flex rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                  {template.category}
                </p>
                <h3 className="text-3xl font-bold mt-2">{template.name}</h3>
                <p className="text-muted-foreground mt-1.5 text-lg">{template.description}</p>
                <Button
                  onClick={() => handleTemplateSelect(id)}
                  className={`mt-4 h-8 px-4 rounded-lg text-xs tracking-[0.14em] uppercase font-semibold ${
                    isSelected
                      ? ''
                      : 'border-border/70 bg-background/40 hover:bg-primary/15 hover:text-foreground'
                  }`}
                  variant={isSelected ? 'default' : 'outline'}
                >
                  {isSelected ? 'Seleccionada' : 'Aplicar'}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(section) => setActiveSection(section as DashboardSection)}
      />
      <main className="flex-1 overflow-auto bg-background p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {activeSection === 'inicio' && (
            <div>
              <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                <Home className="w-4 h-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Panel</span>
              </div>
              {InicioSection}
            </div>
          )}
          {activeSection === 'perfil' && PerfilSection}
          {activeSection === 'botones' && BotonesSection}
          {activeSection === 'plantilla' && PlantillaSection}
        </div>
      </main>
    </div>
  )
}
