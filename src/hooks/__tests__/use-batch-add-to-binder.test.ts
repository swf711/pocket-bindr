/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useBatchAddToBinder } from '../use-batch-add-to-binder'
import { ClientError } from '@/lib/client-error'

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
  return { Wrapper, qc }
}

const mockResult = { slotsAdded: 4, cardsAdded: 2 }

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useBatchAddToBinder', () => {
  it('送出 cardIds/status/quantity 至 batch route', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResult), { status: 200 }),
    )
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useBatchAddToBinder(), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync({ cardIds: ['c1', 'c2'], binderId: 'b-1', status: 'owned', quantity: 2 })
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/binders/b-1/cards/batch',
      expect.objectContaining({ method: 'POST' }),
    )
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)
    expect(body).toEqual({ cardIds: ['c1', 'c2'], status: 'owned', quantity: 2 })
  })

  it('成功後 invalidate collection / cards.all / binders.detail / binders.list', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResult), { status: 200 }),
    )
    const { Wrapper, qc } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useBatchAddToBinder(), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync({ cardIds: ['c1'], binderId: 'b-1', status: 'owned', quantity: 1 })
    })

    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => (c[0] as { queryKey: unknown }).queryKey)
    expect(invalidatedKeys).toContainEqual(['collection'])
    expect(invalidatedKeys).toContainEqual(['cards'])
    expect(invalidatedKeys).toContainEqual(['binders', 'detail', 'b-1'])
    expect(invalidatedKeys).toContainEqual(['binders', 'list'])
  })

  it('409 → BATCH_CAPACITY_EXCEEDED', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'pageLimitReached' }), { status: 409 }),
    )
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useBatchAddToBinder(), { wrapper: Wrapper })

    await act(async () => {
      result.current.mutate({ cardIds: ['c1'], binderId: 'b-1', status: 'owned', quantity: 1 })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ClientError).code).toBe('BATCH_CAPACITY_EXCEEDED')
  })

  it('429 → BATCH_RATE_LIMITED', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'RATE_LIMITED' }), { status: 429 }),
    )
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useBatchAddToBinder(), { wrapper: Wrapper })

    await act(async () => {
      result.current.mutate({ cardIds: ['c1'], binderId: 'b-1', status: 'owned', quantity: 1 })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ClientError).code).toBe('BATCH_RATE_LIMITED')
  })

  it('其他錯誤 → BATCH_ADD_FAILED', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Card not found' }), { status: 404 }),
    )
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useBatchAddToBinder(), { wrapper: Wrapper })

    await act(async () => {
      result.current.mutate({ cardIds: ['c1'], binderId: 'b-1', status: 'owned', quantity: 1 })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ClientError).code).toBe('BATCH_ADD_FAILED')
  })
})
