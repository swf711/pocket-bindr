import { CardStatus } from '@prisma/client'
import { CardWithSet } from './card'

export interface CollectionStatus {
  owned: number | null
  wanted: number | null
}

export interface CardWithCollectionStatus extends CardWithSet {
  collectionStatus: CollectionStatus
}

export interface CollectionToggleInput {
  cardId: string
  status: CardStatus | null
}

export interface CollectionToggleResult {
  success: boolean
  cardId: string
  status: CardStatus | null
}
