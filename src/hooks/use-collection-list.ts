'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { queryKeys, type CollectionFilters } from '@/lib/query-keys'
import { ClientError } from '@/lib/client-error'
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
    // Throw a code (not API text) so the consumer localizes the message.
    throw new ClientError('LOAD_FAILED')
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
