'use client'

import type { User } from '@supabase/supabase-js'
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'

import type { FrontendProfile } from '@/lib/mappers/profile.mapper'
import { toFrontendProfile } from '@/lib/mappers/profile.mapper'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { getSupabaseEnvironment } from '@/lib/supabase/env'
import type { Database } from '@/types/database'

export interface UserProfile {
  id: string
  username?: string
  name: string
  email: string
  phone?: string
  whatsapp?: string
  title?: string
  company?: string
  bio?: string
  profileImage?: string
  bannerImage?: string
  selectedTemplate?: 'minimal-black'
  links?: {
    id: string
    title: string
    url: string
    icon: string
    updatedAt?: string
  }[]
  updatedAt?: string
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string, customUsername?: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const isSupabaseEnabled = Boolean(getSupabaseEnvironment())
type ProfileRow = Database['public']['Tables']['profiles']['Row']

function normalizeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

function slugifyUsername(name: string, email: string): string {
  const base = (name || email.split('@')[0] || 'user')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const normalized = base.length >= 3 ? base.slice(0, 20) : `${base}user`.slice(0, 20)
  return normalized || 'user'
}

function mapFrontendProfileToUserProfile(profile: FrontendProfile): UserProfile {
  return {
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
  }
}

function mapAuthUserToUserProfile(authUser: User): UserProfile {
  const displayName = getPreferredDisplayName(authUser)
  const metadata = authUser.user_metadata ?? {}
  const usernameFromMetadata =
    typeof metadata.username === 'string' && metadata.username.trim().length > 0
      ? metadata.username.trim().toLowerCase()
      : undefined

  return {
    id: authUser.id,
    username: usernameFromMetadata ?? slugifyUsername(displayName, authUser.email ?? authUser.id),
    name: displayName,
    email: authUser.email ?? '',
    selectedTemplate: 'minimal-black',
    links: [],
  }
}

function getPreferredDisplayName(authUser: User): string {
  const metadata = authUser.user_metadata ?? {}
  const metadataName =
    (typeof metadata.full_name === 'string' && metadata.full_name.trim()) ||
    (typeof metadata.name === 'string' && metadata.name.trim())

  if (metadataName) {
    return metadataName
  }

  return authUser.email?.split('@')[0] ?? 'Usuario'
}

function buildUsernameCandidates(authUser: User, displayName: string): string[] {
  const metadata = authUser.user_metadata ?? {}
  const usernameFromMetadata =
    typeof metadata.username === 'string' && metadata.username.trim().length > 0
      ? metadata.username.trim().toLowerCase()
      : undefined

  const base = slugifyUsername(displayName, authUser.email ?? authUser.id).slice(0, 20)
  const suffix = authUser.id.replace(/-/g, '').slice(0, 4)
  const withSuffix = `${base.slice(0, Math.max(3, 20 - (suffix.length + 1)))}-${suffix}`

  const candidates = []
  if (usernameFromMetadata) {
    candidates.push(usernameFromMetadata)
  }
  candidates.push(base, withSuffix)

  return Array.from(new Set(candidates))
}

async function ensureProfileExists(
  supabase: ReturnType<typeof createBrowserSupabaseClient>,
  authUser: User
): Promise<ProfileRow | null> {
  const { data: existingProfile, error: existingError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle()

  if (existingError) {
    console.error('Failed to load existing profile:', existingError)
    return null
  }

  if (existingProfile) {
    return existingProfile as ProfileRow
  }

  const displayName = getPreferredDisplayName(authUser)
  const usernameCandidates = buildUsernameCandidates(authUser, displayName)

  for (const username of usernameCandidates) {
    const { data: createdProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        username,
        full_name: displayName,
        email: authUser.email ?? null,
        template_id: 1,
        is_active: true,
      })
      .select('*')
      .single()

    if (!createError && createdProfile) {
      return createdProfile as ProfileRow
    }

    if (createError?.code === '23505') {
      continue
    }

    console.error('Failed to bootstrap profile:', createError)
    return null
  }

  const { data: hydratedProfile, error: hydratedError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle()

  if (hydratedError) {
    console.error('Failed to hydrate profile after bootstrap:', hydratedError)
    return null
  }

  return (hydratedProfile as ProfileRow | null) ?? null
}

async function fetchCurrentUserFromSupabase(): Promise<UserProfile | null> {
  const supabase = createBrowserSupabaseClient()

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return null
  }

  const profile = await ensureProfileExists(supabase, authUser)

  if (!profile) {
    return mapAuthUserToUserProfile(authUser)
  }

  if (!profile.is_active || profile.deleted_at) {
    return mapAuthUserToUserProfile(authUser)
  }

  const { data: links, error: linksError } = await supabase
    .from('action_buttons')
    .select('*')
    .eq('profile_id', authUser.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  const safeLinks = linksError ? [] : (links ?? [])

  const frontendProfile = toFrontendProfile(profile, safeLinks)
  return mapFrontendProfileToUserProfile(frontendProfile)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hasBootstrappedRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    async function hydrate(options: { showLoader?: boolean } = {}) {
      const showLoader = options.showLoader ?? !hasBootstrappedRef.current

      if (!isSupabaseEnabled) {
        if (isMounted) {
          setUser(null)
          setIsLoading(false)
          hasBootstrappedRef.current = true
        }
        return
      }

      if (showLoader && isMounted) {
        setIsLoading(true)
      }

      try {
        const currentUser = await fetchCurrentUserFromSupabase()
        if (isMounted) {
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Failed to hydrate auth state:', error)
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          hasBootstrappedRef.current = true
          if (showLoader) {
            setIsLoading(false)
          }
        }
      }
    }

    void hydrate({ showLoader: true })

    if (!isSupabaseEnabled) {
      return () => {
        isMounted = false
      }
    }

    const supabase = createBrowserSupabaseClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void hydrate({ showLoader: false })
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim()
    const normalizedPassword = password.trim()

    if (!normalizedEmail || !normalizedPassword) {
      throw new Error('Ingresa email y contraseña para continuar.')
    }

    if (!isSupabaseEnabled) {
      throw new Error('Configuración incompleta: define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    }

    setIsLoading(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      })

      if (error) {
        throw error
      }

      const currentUser = await fetchCurrentUserFromSupabase()
      setUser(currentUser ?? (data.user ? mapAuthUserToUserProfile(data.user) : null))
    } catch (error) {
      throw new Error(normalizeErrorMessage(error, 'No se pudo iniciar sesión.'))
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string, customUsername?: string) => {
    const normalizedName = name.trim()
    const normalizedEmail = email.trim()
    const normalizedPassword = password.trim()

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      throw new Error('Completa nombre, email y contraseña para registrarte.')
    }

    if (normalizedPassword.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres.')
    }

    if (!isSupabaseEnabled) {
      throw new Error('Configuración incompleta: define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    }

    setIsLoading(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const username = customUsername?.trim().toLowerCase() || slugifyUsername(normalizedName, normalizedEmail)

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: normalizedPassword,
        options: {
          data: {
            username,
            full_name: normalizedName,
          },
        },
      })

      if (error) {
        throw error
      }

      if (!data.session) {
        setUser(null)
        throw new Error('Cuenta creada. Revisa tu correo para confirmar antes de iniciar sesión.')
      }

      const currentUser = await fetchCurrentUserFromSupabase()
      setUser(currentUser ?? (data.user ? mapAuthUserToUserProfile(data.user) : null))
    } catch (error) {
      throw new Error(normalizeErrorMessage(error, 'No se pudo completar el registro.'))
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    if (!isSupabaseEnabled) {
      setUser(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const supabase = createBrowserSupabaseClient()

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Failed to sign out:', error)
      }
    } finally {
      setUser(null)
      setIsLoading(false)
    }
  }

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading: isLoading, isLoading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
