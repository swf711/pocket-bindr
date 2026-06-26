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
