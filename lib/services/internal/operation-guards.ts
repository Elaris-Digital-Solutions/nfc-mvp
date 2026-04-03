import 'server-only'

import { AppError } from '@/lib/api/errors'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

type ParsedIdempotencyStorageKey = {
  userId: string
  operation: string
  idempotencyKey: string
}

type IdempotencyReserveRow = {
  acquired: boolean
  response_payload: Json | null
}

type WriteLimitRow = {
  allowed: boolean
  current_count: number
}

type RpcError = {
  message: string
}

type SupabaseRpcClient = {
  rpc(
    fn: string,
    args: Record<string, unknown>
  ): Promise<{ data: unknown; error: RpcError | null }>
}

const DEFAULT_IDEMPOTENCY_TTL_MS = 5 * 60 * 1000

function parseIdempotencyStorageKey(storageKey: string): ParsedIdempotencyStorageKey {
  const parts = storageKey.split(':')

  if (parts.length !== 3) {
    throw new AppError('Invalid idempotency storage key format', 'INTERNAL_ERROR', {
      storageKey,
    })
  }

  const [userId, operation, idempotencyKey] = parts

  return {
    userId,
    operation,
    idempotencyKey,
  }
}

export function buildIdempotencyStorageKey(
  userId: string,
  operation: string,
  idempotencyKey: string
): string {
  return `${userId}:${operation}:${idempotencyKey}`
}

export async function getIdempotentResult<T>(
  storageKey: string,
  ttlMs = DEFAULT_IDEMPOTENCY_TTL_MS
): Promise<T | null> {
  const { userId, operation, idempotencyKey } = parseIdempotencyStorageKey(storageKey)
  const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000))

  const supabase = (await createServerSupabaseClient()) as unknown as SupabaseRpcClient
  const { data, error } = await supabase.rpc('app_reserve_idempotency_key', {
    p_user_id: userId,
    p_operation: operation,
    p_idempotency_key: idempotencyKey,
    p_ttl_seconds: ttlSeconds,
  })

  if (error) {
    throw new AppError('Failed to reserve idempotency key', 'INTERNAL_ERROR', {
      detail: error.message,
      userId,
      operation,
    })
  }

  const row = (Array.isArray(data) ? data[0] : null) as IdempotencyReserveRow | null

  if (!row || row.acquired) {
    return null
  }

  if (row.response_payload === null) {
    throw new AppError('Operation is already in progress. Please retry shortly.', 'CONFLICT', {
      userId,
      operation,
    })
  }

  return row.response_payload as T
}

export async function setIdempotentResult<T>(
  storageKey: string,
  value: T,
  ttlMs = DEFAULT_IDEMPOTENCY_TTL_MS
): Promise<void> {
  const { userId, operation, idempotencyKey } = parseIdempotencyStorageKey(storageKey)
  const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000))

  const supabase = (await createServerSupabaseClient()) as unknown as SupabaseRpcClient
  const { error } = await supabase.rpc('app_store_idempotent_response', {
    p_user_id: userId,
    p_operation: operation,
    p_idempotency_key: idempotencyKey,
    p_response_payload: value as Json,
    p_ttl_seconds: ttlSeconds,
  })

  if (error) {
    throw new AppError('Failed to store idempotent response', 'INTERNAL_ERROR', {
      detail: error.message,
      userId,
      operation,
    })
  }
}

export async function enforceWriteLimit(
  userId: string,
  operation: string,
  limit = 20,
  windowMs = 60_000
): Promise<void> {
  const normalizedLimit = Math.max(1, limit)
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))
  const supabase = (await createServerSupabaseClient()) as unknown as SupabaseRpcClient

  const { data, error } = await supabase.rpc('app_enforce_write_limit', {
    p_user_id: userId,
    p_operation: operation,
    p_limit: normalizedLimit,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    throw new AppError('Failed to enforce write limit', 'INTERNAL_ERROR', {
      detail: error.message,
      userId,
      operation,
    })
  }

  const row = (Array.isArray(data) ? data[0] : null) as WriteLimitRow | null
  if (row && row.allowed === false) {
    throw new AppError('Too many write attempts. Please retry shortly.', 'RATE_LIMITED', {
      operation,
      userId,
      limit: normalizedLimit,
      windowMs,
      currentCount: row.current_count,
    })
  }
}
