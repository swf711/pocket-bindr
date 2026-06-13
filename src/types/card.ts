import { Game, Language } from '@prisma/client'

export interface SetSummary {
  id: string
  name: string
  series: string
  externalId: string
  releaseDate: string | null
}

export interface SetGroup {
  series: string
  latestRelease: string | null
  sets: SetSummary[]
}

export interface CollectionStatus {
  owned: number | null
  wanted: number | null
}

export interface CanonicalCardRef {
  id: string
  imageSmall: string
  imageLarge: string
  language: string
}

export interface CardWithCollectionStatus {
  id: string
  name: string
  imageSmall: string
  imageLarge: string
  rarity: string | null
  hp: number | null
  types: string[]
  cardNumber: string
  isCollectible: boolean
  canonicalCard?: CanonicalCardRef | null
  collectionStatus: CollectionStatus
  set: {
    id: string
    name: string
    series: string
  }
}

export interface CardSearchParams {
  game: Game
  language?: Language
  q?: string
  setId?: string
  page?: number
  pageSize?: number
}

export interface CardSearchResult {
  cards: CardWithSet[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CardWithSet {
  id: string
  ptcgId: string
  name: string
  game: Game
  imageSmall: string
  imageLarge: string
  rarity: string | null
  hp: number | null
  types: string[]
  cardNumber: string
  attributes: Record<string, unknown> | null
  set: {
    id: string
    name: string
    series: string
    game: Game
  }
}
