'use client'

import { useState } from 'react'
import { Home, Palette, Save, User } from 'lucide-react'
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
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-black tracking-tight">Panel de usuario</h1>
        <p className="mt-2 text-muted-foreground text-2xl">
          Gestiona tu perfil, enlaces y plantilla desde el menu lateral.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/60 p-6">
          <h3 className="text-4xl font-bold">Perfil</h3>
          <p className="text-muted-foreground mt-2 text-xl">Actualiza datos profesionales y contacto.</p>
        </div>
        <div className="rounded-2xl border border-border/60 p-6">
          <h3 className="text-4xl font-bold">Botones</h3>
          <p className="text-muted-foreground mt-2 text-xl">Configura enlaces y orden de acciones.</p>
        </div>
        <div className="rounded-2xl border border-border/60 p-6">
          <h3 className="text-4xl font-bold">Plantilla</h3>
          <p className="text-muted-foreground mt-2 text-xl">Elige el estilo visual de tu tarjeta.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 p-6">
        <p className="text-sm tracking-[0.2em] uppercase font-semibold">Siguiente paso</p>
        <p className="text-muted-foreground mt-3 text-xl">
          Completa tu perfil y agrega al menos un boton para publicar una tarjeta utilizable.
        </p>
      </div>
    </div>
  )

  const PerfilSection = (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-black tracking-tight">Mi perfil</h1>
        <p className="mt-2 text-muted-foreground text-2xl">Configura la informacion publica y de contacto.</p>
      </div>

      <div className="rounded-2xl border border-border/60 p-6 space-y-6">
        <p className="text-sm tracking-[0.2em] uppercase font-semibold">Identidad visual</p>
        <div className="relative rounded-xl border border-border/60 p-4 md:p-5 pb-12 overflow-visible">
          <div className="relative h-36 md:h-44 w-full rounded-xl border border-slate-700/60 bg-gradient-to-r from-slate-300 via-slate-700 to-slate-900 shadow-inner">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="absolute z-10 bottom-3 left-28 md:left-36 h-9 rounded-md border-border/70 bg-background/95 text-foreground hover:bg-background"
            >
              Subir foto de perfil
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="absolute z-10 bottom-3 right-3 h-9 rounded-md border-border/70 bg-background/95 text-foreground hover:bg-background"
            >
              Agregar foto de portada
            </Button>
          </div>

          <Avatar className="absolute z-20 -bottom-0 left-12 h-24 w-24 rounded-2xl border-4 border-background shadow-xl">
            <AvatarImage src={user?.profileImage} />
            <AvatarFallback className="rounded-2xl text-xl font-bold bg-zinc-200 text-zinc-900">
              {user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 p-6 space-y-6">
        <p className="text-sm tracking-[0.2em] uppercase font-semibold">Informacion de contacto</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <Button onClick={handleProfileSave} className="px-8">
          <Save className="w-4 h-4 mr-2" />
          Guardar cambios
        </Button>
      </div>
    </div>
  )

  const BotonesSection = (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border/60 p-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-5xl font-black tracking-tight">Mis botones</h1>
          <p className="mt-2 text-muted-foreground text-2xl">Gestiona los botones que se muestran en tu perfil publico.</p>
        </div>
        <span className="text-sm border border-border rounded-md px-3 py-1 font-semibold">{links.length} / 6</span>
      </div>

      <div className="space-y-4">
        {links.map((link, idx) => (
          <div key={link.id} className="rounded-2xl border border-border/60 p-6 space-y-4">
            <p className="text-sm tracking-[0.2em] uppercase font-semibold">Boton #{idx + 1}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="sticky bottom-4 rounded-2xl border border-border/60 bg-background/90 backdrop-blur p-4 flex items-center justify-between gap-3">
        <Button variant="outline" onClick={addLink}>+ Anadir boton</Button>
        <Button onClick={saveLinks} className="px-8">
          <Save className="w-4 h-4 mr-2" />
          Guardar cambios
        </Button>
      </div>
    </div>
  )

  const PlantillaSection = (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase">Direccion visual</span>
        </div>
        <h1 className="text-5xl font-black tracking-tight">Plantillas</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(TEMPLATES).map(([id, template]) => {
          const isSelected = user?.selectedTemplate === id
          return (
            <div key={id} className={`rounded-2xl border p-6 ${isSelected ? 'border-white' : 'border-border/60'}`}>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{template.category}</p>
              <h3 className="text-2xl font-bold mt-1">{template.name}</h3>
              <p className="text-muted-foreground mt-2">{template.description}</p>
              <Button onClick={() => handleTemplateSelect(id)} className="mt-5 w-full" variant={isSelected ? 'default' : 'outline'}>
                {isSelected ? 'Seleccionada' : 'Aplicar'}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 overflow-auto bg-background p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          {activeSection === 'inicio' && (
            <div>
              <div className="flex items-center gap-2 mb-6 text-muted-foreground">
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
