/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useAddToBinder } from '../use-add-to-binder'
import { ClientError } from '@/lib/client-error'

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
  return { Wrapper, qc }
}

const regularCard = { id: 'en-001', isCollectible: true, canonicalCardId: null }
const aliasCard = { id: 'zh-001', isCollectible: false, canonicalCardId: 'ja-001' }

const mockResult = {
  slotsAdded: 1,
  userCard: { id: 'uc-1', cardId: 'en-001', status: 'owned' as const, quantity: 1 },
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useAddToBinder', () => {
  it('通常カードは自身の id で POST を送る', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResult), { status: 200 }),
    )
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useAddToBinder(), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync({ card: regularCard, binderId: 'b-1', status: 'owned', quantity: 1 })
    })

    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.cardId).toBe('en-001')
  })

  it('OPCG ZH_TW alias カードは「元の alias id」で POST を送る（後端で resolve + displayCardId 記録）', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ...mockResult, userCard: { ...mockResult.userCard, cardId: 'ja-001' } }), { status: 200 }),
    )
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useAddToBinder(), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync({ card: aliasCard, binderId: 'b-1', status: 'owned', quantity: 1 })
    })

    // 前端不再預先 resolve：送原始 ZH_TW alias id，由後端記錄 displayCardId 保留顯示語言
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.cardId).toBe('zh-001')
  })

  it('alias カード：invalidate の collection.byCard キーは canonical（JA）で JA/ZH_TW バッジ同期', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ...mockResult, userCard: { ...mockResult.userCard, cardId: 'ja-001' } }), { status: 200 }),
    )
    const { Wrapper, qc } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useAddToBinder(), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync({ card: aliasCard, binderId: 'b-1', status: 'owned', quantity: 1 })
    })

    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => (c[0] as { queryKey: unknown }).queryKey)
    expect(invalidatedKeys).toContainEqual(['collection', 'ja-001'])
  })

  it('成功後に cards.all / collection.byCard / binders.detail / binders.list を invalidate する', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResult), { status: 200 }),
    )
    const { Wrapper, qc } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useAddToBinder(), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync({ card: regularCard, binderId: 'b-1', status: 'owned', quantity: 1 })
    })

    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => (c[0] as { queryKey: unknown }).queryKey)
    expect(invalidatedKeys).toContainEqual(['collection', 'en-001'])
    expect(invalidatedKeys).toContainEqual(['cards'])
    expect(invalidatedKeys).toContainEqual(['binders', 'detail', 'b-1'])
    expect(invalidatedKeys).toContainEqual(['binders', 'list'])
  })

  it('fetch エラー時に mutation が失敗する', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: '加入失敗' }), { status: 400 }),
    )
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useAddToBinder(), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutate({ card: regularCard, binderId: 'b-1', status: 'owned', quantity: 1 })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ClientError)
    expect((result.current.error as ClientError).code).toBe('ADD_FAILED')
  })
})
