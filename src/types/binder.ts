import { GridType } from '@prisma/client'

// ── Binder view types ──────────────────────────────────────────────────────

export type SlotWithCard = {
  id: string
  binderId: string
  cardId: string
  pageNumber: number
  slotIndex: number
  status: 'owned' | 'wanted'
  card: {
    id: string
    name: string
    imageSmall: string
    language: 'EN' | 'JA' | 'ZH_TW'
    cardNumber: string
    rarity: string | null
  }
}

export type EmptySlot = {
  id: null
  pageNumber: number
  slotIndex: number
}

export type BinderSlotItem = SlotWithCard | EmptySlot

export type BinderDetailResponse = {
  id: string
  name: string
  gridType: 'grid_1x2' | 'grid_2x2' | 'grid_3x3' | 'grid_4x3' | 'grid_4x4'
  coverColor: string
  slots: SlotWithCard[]
}

export type SwapSlotsBody = {
  slotAId: string
  slotBId: string
}

export type SwapSlotsResponse = {
  slotA: { id: string; pageNumber: number; slotIndex: number }
  slotB: { id: string; pageNumber: number; slotIndex: number }
}

export type MoveSlotBody = {
  pageNumber: number
  slotIndex: number
}

// ── End binder view types ──────────────────────────────────────────────────

export interface BinderSummary {
  id: string
  name: string
  gridType: GridType
  coverColor: string
  settings: Record<string, unknown> | null
  createdAt: string
  _count: { slots: number }
}

export interface CreateBinderInput {
  name: string
  gridType: GridType
  coverColor?: string
}

export interface UpdateBinderInput {
  name?: string
  gridType?: GridType
  coverColor?: string
}

export const GRID_TYPE_LABELS: Record<GridType, string> = {
  grid_1x2: '1 × 2（每頁 2 格）',
  grid_2x2: '2 × 2（每頁 4 格）',
  grid_3x3: '3 × 3（每頁 9 格）',
  grid_4x3: '4 × 3（每頁 12 格）',
  grid_4x4: '4 × 4（每頁 16 格）',
}

export const GRID_TYPE_SLOTS: Record<GridType, number> = {
  grid_1x2: 2,
  grid_2x2: 4,
  grid_3x3: 9,
  grid_4x3: 12,
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
