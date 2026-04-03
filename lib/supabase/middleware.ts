import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import type { Database } from '@/types/database'
import { getRouteAccess } from '@/lib/security/route-access'
import { getSupabaseEnvironment } from '@/lib/supabase/env'

export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnvironment()
  const pathname = request.nextUrl.pathname
  const routeAccess = getRouteAccess(pathname)

  if (!env) {
    if (process.env.NODE_ENV === 'production' && routeAccess === 'protected') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('reason', 'config-unavailable')
      return NextResponse.redirect(url)
    }

    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && routeAccess === 'protected') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && routeAccess === 'auth') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
