import 'server-only'

import { AppError } from '@/lib/api/errors'

type IdempotencyCacheItem = {
  expiresAt: number
  value: unknown
}

const idempotencyCache = new Map<string, IdempotencyCacheItem>()
const writeWindows = new Map<string, number[]>()

const DEFAULT_IDEMPOTENCY_TTL_MS = 5 * 60 * 1000

function clearExpiredCacheEntries(now: number) {
  for (const [key, item] of idempotencyCache.entries()) {
    if (item.expiresAt <= now) {
      idempotencyCache.delete(key)
    }
  }
}

export function buildIdempotencyStorageKey(
  userId: string,
  operation: string,
  idempotencyKey: string
): string {
  return `${userId}:${operation}:${idempotencyKey}`
}

export function getIdempotentResult<T>(storageKey: string): T | null {
  const now = Date.now()
  clearExpiredCacheEntries(now)

  const cached = idempotencyCache.get(storageKey)
  if (!cached) {
    return null
  }

  return cached.value as T
}

export function setIdempotentResult<T>(
  storageKey: string,
  value: T,
  ttlMs = DEFAULT_IDEMPOTENCY_TTL_MS
): void {
  const expiresAt = Date.now() + ttlMs
  idempotencyCache.set(storageKey, { value, expiresAt })
}

export function enforceWriteLimit(
  userId: string,
  operation: string,
  limit = 20,
  windowMs = 60_000
): void {
  const key = `${userId}:${operation}`
  const now = Date.now()
  const previous = writeWindows.get(key) ?? []
  const activeWindow = previous.filter((timestamp) => now - timestamp <= windowMs)

  if (activeWindow.length >= limit) {
    throw new AppError('Too many write attempts. Please retry shortly.', 'RATE_LIMITED', {
      operation,
      userId,
      limit,
      windowMs,
    })
  }

  activeWindow.push(now)
  writeWindows.set(key, activeWindow)
}
