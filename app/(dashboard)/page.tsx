'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Home, Save, Sparkles } from 'lucide-react'
import {
  createLinkAction,
  deleteLinkAction,
  listLinksAction,
  updateLinkAction,
} from '@/app/actions/links.actions'
import { updateProfileAction } from '@/app/actions/profile.actions'
import { setTemplateAction } from '@/app/actions/template.actions'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/shared/sidebar'
import { useAuth, type UserProfile } from '@/lib/auth-context'
import { TEMPLATES } from '@/lib/constants'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { FrontendProfile } from '@/lib/mappers/profile.mapper'
import type { TemplateKey } from '@/lib/mappers/template.mapper'

type DashboardSection = 'inicio' | 'perfil' | 'botones' | 'plantilla'
type LinkIcon = 'instagram' | 'linkedin' | 'whatsapp' | 'website' | 'link'

type SaveState = 'idle' | 'saving' | 'success' | 'error'

type SaveStatus = {
  state: SaveState
  message: string
}

type ProfileFormState = {
  name: string
  title: string
  company: string
  email: string
  phone: string
  whatsapp: string
  bio: string
  profileImage: string
  bannerImage: string
}

type EditableLink = {
  id: string
  title: string
  url: string
  icon: LinkIcon
  updatedAt?: string
}

const INITIAL_STATUS: SaveStatus = {
  state: 'idle',
  message: '',
}

function buildProfileForm(user: UserProfile | null): ProfileFormState {
  return {
    name: user?.name ?? '',
    title: user?.title ?? '',
    company: user?.company ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    whatsapp: user?.whatsapp ?? '',
    bio: user?.bio ?? '',
    profileImage: user?.profileImage ?? '',
    bannerImage: user?.bannerImage ?? '',
  }
}

type CloudinaryUploadResponse = {
  secure_url?: string
  error?: {
    message?: string
  }
}

async function uploadImageToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error('Falta configuración de Cloudinary en NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME y NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  const payload = (await response.json()) as CloudinaryUploadResponse
  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error?.message ?? 'No se pudo subir la imagen.')
  }

  return payload.secure_url
}

function normalizeIcon(icon: string): LinkIcon {
  if (icon === 'instagram' || icon === 'linkedin' || icon === 'whatsapp' || icon === 'website') {
    return icon
  }

  return 'link'
}

function buildEditableLinks(user: UserProfile | null): EditableLink[] {
  if (!user?.links?.length) {
    return []
  }

  return user.links.map((link) => ({
    id: link.id,
    title: link.title,
    url: link.url,
    icon: normalizeIcon(link.icon),
    updatedAt: link.updatedAt,
  }))
}

function buildIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

function toOptionalString(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function applyFrontendProfileToContext(
  updateProfile: (updates: Partial<UserProfile>) => void,
  profile: FrontendProfile
) {
  updateProfile({
    id: profile.id,
    username: profile.username,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    whatsapp: profile.whatsapp,
    title: profile.title,
    company: profile.company,
    bio: profile.bio,
    profileImage: profile.profileImage,
    bannerImage: profile.bannerImage,
    selectedTemplate: profile.selectedTemplate,
    links: profile.links,
    updatedAt: profile.updatedAt,
  })
}

function buildStatusClass(status: SaveStatus): string {
  if (status.state === 'error') {
    return 'text-red-400'
  }

  if (status.state === 'success') {
    return 'text-emerald-400'
  }

  return 'text-muted-foreground'
}

export default function DashboardPage() {
  const { user, loading, updateProfile } = useAuth()
  const [activeSection, setActiveSection] = useState<DashboardSection>('inicio')
  const [profileForm, setProfileForm] = useState<ProfileFormState>(() => buildProfileForm(user))
  const [links, setLinks] = useState<EditableLink[]>(() => buildEditableLinks(user))
  const [profileStatus, setProfileStatus] = useState<SaveStatus>(INITIAL_STATUS)
  const [linksStatus, setLinksStatus] = useState<SaveStatus>(INITIAL_STATUS)
  const [templateStatus, setTemplateStatus] = useState<SaveStatus>(INITIAL_STATUS)
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false)
  const [isUploadingBannerImage, setIsUploadingBannerImage] = useState(false)
  const profileImageInputRef = useRef<HTMLInputElement>(null)
  const bannerImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setProfileForm(buildProfileForm(user))
    setLinks(buildEditableLinks(user))
  }, [user])

  const handleProfileSave = async () => {
    if (!user) {
      setProfileStatus({
        state: 'error',
        message: 'No hay una sesion activa para guardar cambios.',
      })
      return
    }

    setProfileStatus({
      state: 'saving',
      message: 'Guardando cambios de perfil...',
    })

    const response = await updateProfileAction({
      idempotencyKey: buildIdempotencyKey(),
      updatedAt: user.updatedAt,
      name: toOptionalString(profileForm.name),
      title: toOptionalString(profileForm.title),
      company: toOptionalString(profileForm.company),
      email: toOptionalString(profileForm.email),
      phone: toOptionalString(profileForm.phone),
      whatsapp: toOptionalString(profileForm.whatsapp),
      bio: toOptionalString(profileForm.bio),
      profileImage: toOptionalString(profileForm.profileImage),
      bannerImage: toOptionalString(profileForm.bannerImage),
    })

    if (!response.success) {
      setProfileStatus({
        state: 'error',
        message: response.error.message,
      })
      return
    }

    applyFrontendProfileToContext(updateProfile, response.data)
    setProfileForm({
      name: response.data.name,
      title: response.data.title ?? '',
      company: response.data.company ?? '',
      email: response.data.email,
      phone: response.data.phone ?? '',
      whatsapp: response.data.whatsapp ?? '',
      bio: response.data.bio ?? '',
      profileImage: response.data.profileImage ?? '',
      bannerImage: response.data.bannerImage ?? '',
    })
    setLinks(
      response.data.links.map((link) => ({
        id: link.id,
        title: link.title,
        url: link.url,
        icon: normalizeIcon(link.icon),
        updatedAt: link.updatedAt,
      }))
    )
    setProfileStatus({
      state: 'success',
      message: 'Perfil actualizado correctamente.',
    })
  }

  const handleImageUpload = async (
    field: 'profileImage' | 'bannerImage',
    file: File | undefined
  ) => {
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setProfileStatus({
        state: 'error',
        message: 'Selecciona un archivo de imagen válido.',
      })
      return
    }

    const maxSizeInBytes = 10 * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      setProfileStatus({
        state: 'error',
        message: 'La imagen no debe exceder 10MB.',
      })
      return
    }

    if (field === 'profileImage') {
      setIsUploadingProfileImage(true)
    } else {
      setIsUploadingBannerImage(true)
    }

    try {
      const imageUrl = await uploadImageToCloudinary(file)
      setProfileForm((prev) => ({
        ...prev,
        [field]: imageUrl,
      }))
      setProfileStatus({
        state: 'success',
        message: 'Imagen subida correctamente. Guarda cambios para publicar.',
      })
    } catch (error) {
      setProfileStatus({
        state: 'error',
        message: error instanceof Error ? error.message : 'No se pudo subir la imagen.',
      })
    } finally {
      if (field === 'profileImage') {
        setIsUploadingProfileImage(false)
      } else {
        setIsUploadingBannerImage(false)
      }
    }
  }

  const handleTemplateSelect = async (templateId: TemplateKey) => {
    if (!user) {
      setTemplateStatus({
        state: 'error',
        message: 'No hay una sesion activa para actualizar plantilla.',
      })
      return
    }

    setTemplateStatus({
      state: 'saving',
      message: 'Aplicando plantilla...',
    })

    const response = await setTemplateAction({
      idempotencyKey: buildIdempotencyKey(),
      updatedAt: user.updatedAt,
      selectedTemplate: templateId,
    })

    if (!response.success) {
      setTemplateStatus({
        state: 'error',
        message: response.error.message,
      })
      return
    }

    updateProfile({
      selectedTemplate: response.data.selectedTemplate,
      updatedAt: response.data.updatedAt,
    })
    setTemplateStatus({
      state: 'success',
      message: 'Plantilla actualizada.',
    })
  }

  const selectedTemplateKey = (user?.selectedTemplate ?? 'minimal-black') as TemplateKey
  const activeTemplate = TEMPLATES[selectedTemplateKey] ?? TEMPLATES['minimal-black']

  const updateLink = (id: string, field: 'title' | 'url' | 'icon', value: string) => {
    setLinks((prev) => prev.map((link) => (link.id === id ? { ...link, [field]: value } : link)))
  }

  const removeLink = (id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id))
  }

  const addLink = () => {
    if (links.length >= 6) return
    setLinks((prev) => [
      ...prev,
      { id: buildIdempotencyKey(), title: '', url: '', icon: 'website' },
    ])
  }

  const saveLinks = async () => {
    if (!user) {
      setLinksStatus({
        state: 'error',
        message: 'No hay una sesion activa para guardar enlaces.',
      })
      return
    }

    for (const link of links) {
      const title = link.title.trim()
      const url = link.url.trim()

      if (!title || !url) {
        setLinksStatus({
          state: 'error',
          message: 'Todos los botones deben incluir etiqueta y URL.',
        })
        return
      }

      try {
        new URL(url)
      } catch {
        setLinksStatus({
          state: 'error',
          message: `La URL de "${title}" no es valida.`,
        })
        return
      }
    }

    setLinksStatus({
      state: 'saving',
      message: 'Sincronizando botones...',
    })

    const previousLinks = user.links ?? []
    const previousById = new Map(previousLinks.map((link) => [link.id, link]))
    const currentIds = new Set(links.map((link) => link.id))

    for (const existing of previousLinks) {
      if (currentIds.has(existing.id)) {
        continue
      }

      const deleteResponse = await deleteLinkAction({
        idempotencyKey: buildIdempotencyKey(),
        id: existing.id,
      })

      if (!deleteResponse.success) {
        setLinksStatus({
          state: 'error',
          message: deleteResponse.error.message,
        })
        return
      }
    }

    for (const link of links) {
      const existing = previousById.get(link.id)
      const basePayload = {
        idempotencyKey: buildIdempotencyKey(),
        title: link.title.trim(),
        url: link.url.trim(),
        icon: normalizeIcon(link.icon),
      }

      if (existing) {
        const updateResponse = await updateLinkAction({
          ...basePayload,
          id: link.id,
          updatedAt: existing.updatedAt,
        })

        if (!updateResponse.success) {
          setLinksStatus({
            state: 'error',
            message: updateResponse.error.message,
          })
          return
        }
      } else {
        const createResponse = await createLinkAction(basePayload)

        if (!createResponse.success) {
          setLinksStatus({
            state: 'error',
            message: createResponse.error.message,
          })
          return
        }
      }
    }

    const refreshResponse = await listLinksAction()
    if (!refreshResponse.success) {
      setLinksStatus({
        state: 'error',
        message: refreshResponse.error.message,
      })
      return
    }

    const refreshedLinks: EditableLink[] = refreshResponse.data.map((link) => ({
      id: link.id,
      title: link.title,
      url: link.url,
      icon: normalizeIcon(link.icon),
      updatedAt: link.updatedAt,
    }))

    setLinks(refreshedLinks)
    updateProfile({
      links: refreshedLinks,
    })
    setLinksStatus({
      state: 'success',
      message: 'Botones actualizados correctamente.',
    })
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-muted-foreground">Cargando dashboard...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold">Sesion no disponible</h1>
          <p className="text-muted-foreground">Inicia sesion para administrar tu dashboard.</p>
          <Button asChild>
            <Link href="/login">Ir a login</Link>
          </Button>
        </div>
      </div>
    )
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
          <input
            ref={profileImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              void handleImageUpload('profileImage', event.target.files?.[0])
              event.target.value = ''
            }}
          />
          <input
            ref={bannerImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              void handleImageUpload('bannerImage', event.target.files?.[0])
              event.target.value = ''
            }}
          />

          <div className="relative h-32 md:h-40 w-full rounded-lg border border-primary/40 shadow-inner overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: profileForm.bannerImage
                  ? `url(${profileForm.bannerImage})`
                  : 'linear-gradient(to right, rgba(255,255,255,0.7), #22324e, #0d1f3c)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-black/25 to-black/40" />

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => profileImageInputRef.current?.click()}
              disabled={isUploadingProfileImage || profileStatus.state === 'saving'}
              className="absolute z-10 bottom-3 left-24 md:left-32 h-8 rounded-md border-border/70 bg-background/95 text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-primary/50 hover:bg-background hover:shadow-lg hover:shadow-black/30 active:translate-y-0 active:scale-100"
            >
              {isUploadingProfileImage ? 'Subiendo...' : 'Subir foto de perfil'}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => bannerImageInputRef.current?.click()}
              disabled={isUploadingBannerImage || profileStatus.state === 'saving'}
              className="absolute z-10 bottom-3 right-3 h-8 rounded-md border-border/70 bg-background/95 text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-primary/50 hover:bg-background hover:shadow-lg hover:shadow-black/30 active:translate-y-0 active:scale-100"
            >
              {isUploadingBannerImage ? 'Subiendo...' : 'Agregar foto de portada'}
            </Button>
          </div>

          <Avatar className="absolute z-20 -bottom-0 left-10 h-20 w-20 rounded-xl border-4 border-background shadow-xl">
            <AvatarImage src={profileForm.profileImage || undefined} />
            <AvatarFallback className="rounded-xl text-lg font-bold bg-white text-black">
              {profileForm.name?.charAt(0) || 'U'}
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
        <Button
          onClick={() => void handleProfileSave()}
          className="px-6"
          disabled={profileStatus.state === 'saving'}
        >
          <Save className="w-4 h-4 mr-2" />
          {profileStatus.state === 'saving' ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>

      {profileStatus.state !== 'idle' && (
        <p className={`text-sm font-medium text-right ${buildStatusClass(profileStatus)}`}>
          {profileStatus.message}
        </p>
      )}
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
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm tracking-[0.2em] uppercase font-semibold">Boton #{idx + 1}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeLink(link.id)}
                disabled={linksStatus.state === 'saving'}
              >
                Eliminar
              </Button>
            </div>
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
                  onChange={(e) => updateLink(link.id, 'icon', normalizeIcon(e.target.value))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                >
                  <option value="instagram">instagram</option>
                  <option value="linkedin">linkedin</option>
                  <option value="whatsapp">whatsapp</option>
                  <option value="website">website</option>
                  <option value="link">link</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {linksStatus.state !== 'idle' && (
        <p className={`text-sm font-medium ${buildStatusClass(linksStatus)}`}>{linksStatus.message}</p>
      )}

      <div className="sticky bottom-4 rounded-xl border border-border/60 bg-background/90 backdrop-blur p-3 flex items-center justify-between gap-3">
        <Button variant="outline" onClick={addLink} disabled={linksStatus.state === 'saving'}>
          + Anadir boton
        </Button>
        <Button
          onClick={() => void saveLinks()}
          className="px-6"
          disabled={linksStatus.state === 'saving'}
        >
          <Save className="w-4 h-4 mr-2" />
          {linksStatus.state === 'saving' ? 'Guardando...' : 'Guardar cambios'}
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
        {(Object.entries(TEMPLATES) as Array<[TemplateKey, (typeof TEMPLATES)[TemplateKey]]>).map(
          ([id, template]) => {
            const isSelected = user.selectedTemplate === id
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
                          {user.name || 'Sin nombre'}
                        </p>
                        <p className={`text-xs truncate ${isLight ? 'text-black/60' : 'text-white/70'}`}>
                          {user.title || 'Sin cargo'}
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
                    onClick={() => void handleTemplateSelect(id)}
                    className={`mt-4 h-8 px-4 rounded-lg text-xs tracking-[0.14em] uppercase font-semibold ${
                      isSelected
                        ? ''
                        : 'border-border/70 bg-background/40 hover:bg-primary/15 hover:text-foreground'
                    }`}
                    variant={isSelected ? 'default' : 'outline'}
                    disabled={templateStatus.state === 'saving'}
                  >
                    {isSelected ? 'Seleccionada' : 'Aplicar'}
                  </Button>
                </div>
              </div>
            )
          }
        )}
      </div>

      {templateStatus.state !== 'idle' && (
        <p className={`text-sm font-medium ${buildStatusClass(templateStatus)}`}>
          {templateStatus.message}
        </p>
      )}
    </div>
  )

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen animate-in fade-in duration-700 ease-out">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(section) => setActiveSection(section as DashboardSection)}
      />
      <main className="flex-1 overflow-auto bg-background p-4 md:p-6 animate-in slide-in-from-bottom-4 duration-700 ease-out delay-150 fill-mode-both">
        <div className="max-w-[1200px] mx-auto lg:px-8 xl:px-22">
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
