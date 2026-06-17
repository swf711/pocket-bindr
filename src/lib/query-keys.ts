export type CardSearchFilters = {
  game: string
  language: string
  setId?: string
  q?: string
  page: number
  pageSize?: number
}

export const queryKeys = {
  cards: {
    all: ['cards'] as const,
    search: (filters: CardSearchFilters) => ['cards', 'search', filters] as const,
  },
  binders: {
    all: ['binders'] as const,
    list: () => ['binders', 'list'] as const,
    detail: (id: string) => ['binders', 'detail', id] as const,
  },
  // collection.byCard は現時点では invalidation key のみ（GET endpoint 未整備）
  // badge 同期は cards.all 前綴 invalidation で実現
  collection: {
    byCard: (resolvedCardId: string) => ['collection', resolvedCardId] as const,
  },
} as const
