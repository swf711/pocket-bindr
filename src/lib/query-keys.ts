export type CardSearchFilters = {
  game: string
  language: string
  setId?: string
  q?: string
  page: number
  pageSize?: number
}

export type CollectionFilters = {
  status?: 'owned' | 'wanted'
  game?: string
  language?: string
  setId?: string
  q?: string
  page: number
  pageSize?: number
}

export const queryKeys = {
  cards: {
    all: ['cards'] as const,
    search: (filters: CardSearchFilters) => ['cards', 'search', filters] as const,
    /** 單卡的 user-specific 收藏狀態（GET /api/cards/[id]）——列表回應為公開快取、刻意不含此資訊。 */
    status: (cardId: string) => ['cards', 'status', cardId] as const,
  },
  binders: {
    all: ['binders'] as const,
    list: () => ['binders', 'list'] as const,
    detail: (id: string) => ['binders', 'detail', id] as const,
  },
  collection: {
    byCard: (resolvedCardId: string) => ['collection', resolvedCardId] as const,
    list: (filters: CollectionFilters) => ['collection', 'list', filters] as const,
  },
} as const
