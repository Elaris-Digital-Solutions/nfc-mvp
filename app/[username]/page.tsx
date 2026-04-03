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

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  noStore()

  if (!getSupabaseEnvironment()) {
    notFound()
  }

  const { username } = await params

  try {
    const profile = await profileService.getProfileByUsername({ username })
    return <LinktreeCard profile={profile} />
  } catch {
    notFound()
  }
}
