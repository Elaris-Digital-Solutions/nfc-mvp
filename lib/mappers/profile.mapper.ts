import type { Database } from '@/types/database'
import { toTemplateId, toTemplateKey, type TemplateKey } from '@/lib/mappers/template.mapper'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
type ActionButtonRow = Database['public']['Tables']['action_buttons']['Row']
type ActionButtonInsert = Database['public']['Tables']['action_buttons']['Insert']

export type FrontendLink = {
  id: string
  title: string
  url: string
  icon: string
  updatedAt?: string
}

export type FrontendProfile = {
  id: string
  username: string
  name: string
  email: string
  phone?: string
  whatsapp?: string
  title?: string
  company?: string
  bio?: string
  profileImage?: string
  bannerImage?: string
  selectedTemplate: TemplateKey
  links: FrontendLink[]
  updatedAt?: string
}

export type FrontendProfileUpdate = Partial<Omit<FrontendProfile, 'id' | 'links' | 'selectedTemplate'>> & {
  selectedTemplate?: TemplateKey
}

export type FrontendLinkInput = {
  title: string
  url: string
  icon: string
}

function toOptionalString(value: string | null | undefined): string | undefined {
  if (!value) return undefined

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function toNullableString(value: string | undefined): string | null {
  if (!value) return null

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function toFrontendLink(button: ActionButtonRow): FrontendLink {
  return {
    id: button.id,
    title: button.label,
    url: button.url,
    icon: button.icon,
    updatedAt: toOptionalString(button.updated_at),
  }
}

export function toBackendLinkInsert(
  profileId: string,
  input: FrontendLinkInput,
  sortOrder: number
): ActionButtonInsert {
  return {
    profile_id: profileId,
    label: input.title,
    url: input.url,
    icon: input.icon,
    sort_order: sortOrder,
    is_active: true,
    deleted_at: null,
  }
}

export function toFrontendProfile(
  profile: ProfileRow,
  links: ActionButtonRow[] = []
): FrontendProfile {
  return {
    id: profile.id,
    username: profile.username,
    name: profile.full_name ?? profile.username,
    email: profile.email ?? '',
    phone: toOptionalString(profile.phone),
    whatsapp: toOptionalString(profile.whatsapp),
    title: toOptionalString(profile.job_title),
    company: toOptionalString(profile.company),
    bio: toOptionalString(profile.bio),
    profileImage: toOptionalString(profile.avatar_url),
    bannerImage: toOptionalString(profile.banner_url),
    selectedTemplate: toTemplateKey(profile.template_id),
    links: links.map(toFrontendLink),
    updatedAt: toOptionalString(profile.updated_at),
  }
}

export function toBackendProfile(update: FrontendProfileUpdate): ProfileUpdate {
  const mapped: ProfileUpdate = {}

  if (update.username !== undefined) {
    mapped.username = update.username.trim().toLowerCase()
  }
  if (update.name !== undefined) {
    mapped.full_name = toNullableString(update.name)
  }
  if (update.email !== undefined) {
    mapped.email = toNullableString(update.email)
  }
  if (update.phone !== undefined) {
    mapped.phone = toNullableString(update.phone)
  }
  if (update.whatsapp !== undefined) {
    mapped.whatsapp = toNullableString(update.whatsapp)
  }
  if (update.title !== undefined) {
    mapped.job_title = toNullableString(update.title)
  }
  if (update.company !== undefined) {
    mapped.company = toNullableString(update.company)
  }
  if (update.bio !== undefined) {
    mapped.bio = toNullableString(update.bio)
  }
  if (update.profileImage !== undefined) {
    mapped.avatar_url = toNullableString(update.profileImage)
  }
  if (update.bannerImage !== undefined) {
    mapped.banner_url = toNullableString(update.bannerImage)
  }
  if (update.selectedTemplate !== undefined) {
    mapped.template_id = toTemplateId(update.selectedTemplate)
  }

  return mapped
}
