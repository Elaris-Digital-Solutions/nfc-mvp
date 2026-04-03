import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'

import { LinktreeCard } from '@/components/card/linktree-card'
import { profileService } from '@/lib/services/profile.service'
import { getSupabaseEnvironment } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PublicProfilePageProps = {
  params: Promise<{
    username: string
  }>
}

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<import('next').Metadata> {
  const { username } = await params
  
  const profile = await profileService
    .getProfileByUsername({ username })
    .catch(() => null)

  if (!profile) return { title: 'Perfil no encontrado' }

  return {
    title: `${profile.name} | Identidad Digital`,
    description: profile.bio || profile.title || `Conecta con ${profile.name}`,
    openGraph: {
      title: `${profile.name} | Identidad Digital`,
      description: profile.bio || profile.title || `Conecta con ${profile.name}`,
      images: profile.profileImage ? [{ url: profile.profileImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${profile.name} | Identidad Digital`,
      description: profile.bio || profile.title || `Conecta con ${profile.name}`,
      images: profile.profileImage ? [profile.profileImage] : [],
    }
  }
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  noStore()

  if (!getSupabaseEnvironment()) {
    notFound()
  }

  const { username } = await params

  const profile = await profileService
    .getProfileByUsername({ username })
    .catch(() => null)

  if (!profile) {
    notFound()
  }

  return <LinktreeCard profile={profile} />
}
