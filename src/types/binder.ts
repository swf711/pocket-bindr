import { CardStatus } from '@prisma/client'

export interface BinderSummary {
  id: string
  name: string
  gridType: string
}

export interface AddToBinderInput {
  cardId: string
  binderId: string
  status: CardStatus
  quantity: number
}
