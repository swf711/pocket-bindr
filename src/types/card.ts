import { Game } from '@prisma/client'

export interface CardSearchParams {
  game: Game
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
