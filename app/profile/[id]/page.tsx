import { unstable_noStore as noStore } from 'next/cache'
import { notFound, redirect } from 'next/navigation'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseEnvironment } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type LegacyProfilePageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function LegacyProfilePage({ params }: LegacyProfilePageProps) {
  noStore()

  if (!getSupabaseEnvironment()) {
    notFound()
  }

  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username, is_active, deleted_at')
    .eq('id', id)
    .single()

  if (error || !profile || !profile.username || !profile.is_active || profile.deleted_at) {
    notFound()
  }

  redirect(`/${profile.username}`)
}
