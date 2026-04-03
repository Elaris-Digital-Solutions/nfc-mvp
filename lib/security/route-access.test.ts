import { describe, expect, it } from 'vitest'

import { getRouteAccess, isAuthRoute, isProtectedRoute } from '@/lib/security/route-access'

describe('route access map', () => {
  it('classifies auth routes', () => {
    expect(isAuthRoute('/login')).toBe(true)
    expect(isAuthRoute('/signup')).toBe(true)
    expect(getRouteAccess('/signup')).toBe('auth')
  })

  it('classifies protected routes', () => {
    expect(isProtectedRoute('/dashboard')).toBe(true)
    expect(isProtectedRoute('/dashboard/settings')).toBe(true)
    expect(isProtectedRoute('/tarjeta')).toBe(true)
    expect(getRouteAccess('/dashboard')).toBe('protected')
  })

  it('defaults to public for unknown routes', () => {
    expect(isAuthRoute('/')).toBe(false)
    expect(isProtectedRoute('/')).toBe(false)
    expect(getRouteAccess('/public/profile')).toBe('public')
  })
})
