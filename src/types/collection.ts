import { CardStatus } from '@prisma/client'
import { CardWithSet } from './card'

export interface CardWithCollectionStatus extends CardWithSet {
  collectionStatus: CardStatus | null
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
