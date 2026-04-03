import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildIdempotencyStorageKey,
  enforceWriteLimit,
  getIdempotentResult,
  setIdempotentResult,
} from '@/lib/services/internal/operation-guards'

const rpcMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    rpc: rpcMock,
  })),
}))

describe('operation guards', () => {
  beforeEach(() => {
    rpcMock.mockReset()
  })

  it('builds idempotency storage keys', () => {
    expect(buildIdempotencyStorageKey('user-1', 'links.update', 'abc')).toBe(
      'user-1:links.update:abc'
    )
  })

  it('returns cached payload for duplicate idempotency keys', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ acquired: false, response_payload: { id: 'link-1' } }],
      error: null,
    })

    const result = await getIdempotentResult<{ id: string }>('user-1:links.update:key-1', 2500)

    expect(result).toEqual({ id: 'link-1' })
    expect(rpcMock).toHaveBeenCalledWith('app_reserve_idempotency_key', {
      p_user_id: 'user-1',
      p_operation: 'links.update',
      p_idempotency_key: 'key-1',
      p_ttl_seconds: 3,
    })
  })

  it('returns null when idempotency key is acquired by current operation', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ acquired: true, response_payload: null }],
      error: null,
    })

    const result = await getIdempotentResult('user-1:links.update:key-2')

    expect(result).toBeNull()
  })

  it('throws conflict when duplicate key exists but response is pending', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ acquired: false, response_payload: null }],
      error: null,
    })

    await expect(getIdempotentResult('user-1:links.update:key-3')).rejects.toMatchObject({
      code: 'CONFLICT',
    })
  })

  it('stores idempotent result through RPC', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    await setIdempotentResult('user-1:profile.update:key-1', { ok: true }, 1000)

    expect(rpcMock).toHaveBeenCalledWith('app_store_idempotent_response', {
      p_user_id: 'user-1',
      p_operation: 'profile.update',
      p_idempotency_key: 'key-1',
      p_response_payload: { ok: true },
      p_ttl_seconds: 1,
    })
  })

  it('enforces write limits and throws rate-limited when blocked', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ allowed: false, current_count: 20 }],
      error: null,
    })

    await expect(enforceWriteLimit('user-1', 'profile.update')).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    })
  })

  it('throws internal error when RPC fails', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'rpc failed' },
    })

    await expect(getIdempotentResult('user-1:links.update:key-4')).rejects.toMatchObject({
      code: 'INTERNAL_ERROR',
      message: 'Failed to reserve idempotency key',
      context: {
        detail: 'rpc failed',
        userId: 'user-1',
        operation: 'links.update',
      },
    })
  })
})
