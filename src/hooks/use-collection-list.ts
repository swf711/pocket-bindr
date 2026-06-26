'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { queryKeys, type CollectionFilters } from '@/lib/query-keys'
import type { CardWithCollectionStatus } from '@/types/card'

export interface CollectionListResponse {
  cards: CardWithCollectionStatus[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

async function fetchCollectionApi(filters: CollectionFilters): Promise<CollectionListResponse> {
  const params = new URLSearchParams()
  params.set('page', String(filters.page))
  params.set('pageSize', String(filters.pageSize ?? 20))
  if (filters.status) params.set('status', filters.status)
  if (filters.game) params.set('game', filters.game)
  if (filters.language) params.set('language', filters.language)
  if (filters.setId) params.set('setId', filters.setId)
  if (filters.q) params.set('q', filters.q)

  const res = await fetch(`/api/collection?${params.toString()}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? '載入失敗，請稍後再試')
  }
  return res.json()
}

export function useCollectionList(filters: CollectionFilters) {
  return useQuery({
    queryKey: queryKeys.collection.list(filters),
    queryFn: () => fetchCollectionApi(filters),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}
