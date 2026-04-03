export type RouteAccess = 'public' | 'auth' | 'protected'

const AUTH_ROUTE_PREFIXES = ['/login', '/signup']
const PROTECTED_ROUTE_PREFIXES = ['/dashboard', '/tarjeta']

function matchesRoutePrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function matchesAnyPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => matchesRoutePrefix(pathname, prefix))
}

export function isAuthRoute(pathname: string): boolean {
  return matchesAnyPrefix(pathname, AUTH_ROUTE_PREFIXES)
}

export function isProtectedRoute(pathname: string): boolean {
  return matchesAnyPrefix(pathname, PROTECTED_ROUTE_PREFIXES)
}

export function getRouteAccess(pathname: string): RouteAccess {
  if (isAuthRoute(pathname)) {
    return 'auth'
  }

  if (isProtectedRoute(pathname)) {
    return 'protected'
  }

  return 'public'
}
