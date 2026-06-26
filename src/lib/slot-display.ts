import type { SlotWithCard } from '@/types/binder'

/** 卡牌顯示欄位（格位呈現所需），canonical 與 display 共用。 */
const cardDisplaySelect = {
  id: true,
  name: true,
  imageSmall: true,
  language: true,
  cardNumber: true,
  rarity: true,
} as const

/**
 * 查詢格位時同時帶 canonical card 與 displayCard，以便還原 OPCG ZH_TW 的原始顯示語言。
 * 用於 GET /api/binders/[id]、GET /api/b/[token]、POST /api/binders/[id]/slots。
 */
export const slotDisplaySelect = {
  id: true,
  binderId: true,
  cardId: true,
  displayCardId: true,
  pageNumber: true,
  slotIndex: true,
  status: true,
  card: { select: cardDisplaySelect },
  displayCard: { select: cardDisplaySelect },
} as const

type RawSlotForDisplay = {
  id: string
  binderId: string
  cardId: string | null
  displayCardId: string | null
  pageNumber: number
  slotIndex: number
  status: 'owned' | 'wanted' | null
  card: {
    id: string
    name: string
    imageSmall: string
    language: 'EN' | 'JA' | 'ZH_TW'
    cardNumber: string
    rarity: string | null
  } | null
  displayCard: {
    id: string
    name: string
    imageSmall: string
    language: 'EN' | 'JA' | 'ZH_TW'
    cardNumber: string
    rarity: string | null
  } | null
}

/**
 * 將原始格位投影成「顯示身份」：card = displayCard ?? card、cardId = 顯示卡 id。
 * canonical id 不外露給前端（前端無需感知 alias）。僅用於已填卡的格位。
 */
export function toDisplaySlot(slot: RawSlotForDisplay): SlotWithCard {
  const card = slot.displayCard ?? slot.card!
  return {
    id: slot.id,
    binderId: slot.binderId,
    cardId: card.id,
    pageNumber: slot.pageNumber,
    slotIndex: slot.slotIndex,
    status: slot.status as 'owned' | 'wanted',
    card,
  }
}
