'use client'

import { useEffect, useRef, useState } from 'react'
import {
  createLinkAction,
  deleteLinkAction,
  listLinksAction,
  updateLinkAction,
} from '@/app/actions/links.actions'
import { updateProfileAction } from '@/app/actions/profile.actions'
import { setTemplateAction } from '@/app/actions/template.actions'
import { useAuth, type UserProfile } from '@/lib/auth-context'
import { TEMPLATES } from '@/lib/constants'
import type { FrontendProfile } from '@/lib/mappers/profile.mapper'
import type { TemplateKey } from '@/lib/mappers/template.mapper'

export type DashboardSection = 'inicio' | 'perfil' | 'botones' | 'plantilla'
export type LinkIcon = 'instagram' | 'linkedin' | 'whatsapp' | 'website' | 'link'

export type SaveState = 'idle' | 'saving' | 'success' | 'error'

export type SaveStatus = {
  state: SaveState
  message: string
}

export type ProfileFormState = {
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

export type EditableLink = {
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

type ImageUploadApiResponse =
  | {
      success: true
      data: {
        url: string
      }
    }
  | {
      success: false
      error: {
        message: string
      }
    }

async function uploadImageToCloudinary(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/uploads/image', {
    method: 'POST',
    body: formData,
  })

  const payload = (await response.json()) as ImageUploadApiResponse
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'No se pudo subir la imagen.' : payload.error.message)
  }

  return payload.data.url
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

export function useDashboardController() {
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
        message: 'Selecciona un archivo de imagen valido.',
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

  const updateLink = (id: string, field: 'title' | 'url' | 'icon', value: string) => {
    setLinks((prev) => prev.map((link) => (link.id === id ? { ...link, [field]: value } : link)))
  }

  const removeLink = (id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id))
  }

  const addLink = () => {
    if (links.length >= 6) {
      return
    }

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

  const selectedTemplateKey = (user?.selectedTemplate ?? 'minimal-black') as TemplateKey
  const activeTemplate = TEMPLATES[selectedTemplateKey] ?? TEMPLATES['minimal-black']

  return {
    user,
    loading,
    activeSection,
    setActiveSection,
    profileForm,
    setProfileForm,
    links,
    profileStatus,
    linksStatus,
    templateStatus,
    isUploadingProfileImage,
    isUploadingBannerImage,
    profileImageInputRef,
    bannerImageInputRef,
    activeTemplate,
    handleProfileSave,
    handleImageUpload,
    handleTemplateSelect,
    updateLink,
    removeLink,
    addLink,
    saveLinks,
  }
}
