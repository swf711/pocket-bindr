import type { Game, Language } from '@prisma/client'
import type { CollectionStatus } from './card'

export type LatestSet = {
  id: string
  name: string
  game: Game
  language: Language
  symbolUrl: string | null
  releaseDate: Date
  totalCards: number
  externalId: string
}

export type ShowcaseCard = {
  id: string
  externalId: string
  game: Game
  language: Language
  name: string
  imageSmall: string
  imageLarge: string
  supertype: string
  rarity: string | null
  hp: number | null
  types: string[]
  cardNumber: string
  isCollectible: boolean
  canonicalCardId: string | null
  attributes: Record<string, unknown> | null
  canonicalCard?: null
  collectionStatus: CollectionStatus
  set: {
    id: string
    name: string
    series: string
    externalId: string
    releaseDate: string | null
  }
  zhName?: string
  zhSetName?: string
}

export type GameTabData = {
  showcaseCards: ShowcaseCard[]
  latestSets: LatestSet[]
}
