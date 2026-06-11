import { GridType } from '@prisma/client'

export interface BinderSummary {
  id: string
  name: string
  gridType: GridType
  settings: Record<string, unknown> | null
  createdAt: string
  _count: { slots: number }
}

export interface CreateBinderInput {
  name: string
  gridType: GridType
}

export interface UpdateBinderInput {
  name?: string
  gridType?: GridType
}

export const GRID_TYPE_LABELS: Record<GridType, string> = {
  grid_1x2: '1 × 2（每頁 2 格）',
  grid_2x2: '2 × 2（每頁 4 格）',
  grid_3x3: '3 × 3（每頁 9 格）',
  grid_3x4: '3 × 4（每頁 12 格）',
  grid_4x4: '4 × 4（每頁 16 格）',
}

export const GRID_TYPE_SLOTS: Record<GridType, number> = {
  grid_1x2: 2,
  grid_2x2: 4,
  grid_3x3: 9,
  grid_3x4: 12,
  grid_4x4: 16,
}

export interface AddToBinderPayload {
  cardId: string
  status: 'owned' | 'wanted'
  quantity: number
}

export interface AddToBinderResult {
  slotsAdded: number
  userCard: {
    id: string
    cardId: string
    status: 'owned' | 'wanted'
    quantity: number
  }
}

export interface CardCollectionSummary {
  ownedCount: number
  wantedCount: number
}
