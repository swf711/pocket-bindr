'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { queryKeys, type CardSearchFilters } from '@/lib/query-keys'
import type { CardWithCollectionStatus } from '@/types/card'

export interface CardSearchResponse {
  cards: CardWithCollectionStatus[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

async function fetchCardsApi(filters: CardSearchFilters): Promise<CardSearchResponse> {
  const params = new URLSearchParams({
    game: filters.game,
    language: filters.language,
    page: String(filters.page),
    pageSize: String(filters.pageSize ?? 20),
  })
  if (filters.q) params.set('q', filters.q)
  if (filters.setId) params.set('setId', filters.setId)

  const res = await fetch(`/api/cards?${params.toString()}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? '載入失敗，請稍後再試')
  }
  return res.json()
}

export function useCardSearch(filters: CardSearchFilters) {
  return useQuery({
    queryKey: queryKeys.cards.search(filters),
    queryFn: () => fetchCardsApi(filters),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(filters.game),
  })
}
