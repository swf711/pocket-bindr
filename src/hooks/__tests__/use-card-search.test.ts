/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useCardSearch } from '../use-card-search'
import { ClientError } from '@/lib/client-error'
import type { CardSearchFilters } from '@/lib/query-keys'

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
  return { Wrapper, qc }
}

const baseFilters: CardSearchFilters = { game: 'PTCG', language: 'ZH_TW', page: 1 }

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useCardSearch', () => {
  it('game が空の場合は enabled=false でクエリを発行しない', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(
      () => useCardSearch({ game: '', language: 'ZH_TW', page: 1 }),
      { wrapper: Wrapper },
    )
    // isPending=true but fetch never called
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('game が存在する場合は /api/cards へ fetch を発行する', async () => {
    const mockData = { cards: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), { status: 200 }),
    )
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useCardSearch(baseFilters), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.total).toBe(0)
  })

  it('filters の各フィールドが queryKey に含まれる', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ cards: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }), { status: 200 }),
    )
    const { Wrapper, qc } = makeWrapper()
    renderHook(
      () => useCardSearch({ game: 'OPCG', language: 'JA', setId: 'set-1', q: 'pikachu', page: 2 }),
      { wrapper: Wrapper },
    )
    const cache = qc.getQueryCache().getAll()
    expect(cache.length).toBeGreaterThan(0)
    const key = cache[0].queryKey
    expect(key).toEqual(['cards', 'search', { game: 'OPCG', language: 'JA', setId: 'set-1', q: 'pikachu', page: 2 }])
  })

  it('fetch 失敗時に isError=true になる', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: '載入失敗' }), { status: 500 }),
    )
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useCardSearch(baseFilters), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ClientError)
    expect((result.current.error as ClientError).code).toBe('LOAD_FAILED')
  })
})
