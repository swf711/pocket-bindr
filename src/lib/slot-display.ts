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
 * 將原始格位投影成「顯示身份」：name/id/language = displayCard ?? card，
 * 但 imageSmall 固定取 canonical（slot.card）——OPCG ZH_TW alias 無實體印刷圖，
 * 圖片一律指向 JA canonical；名稱/身份與 CardDetailDrawer 對齊，圖片與其一致。
 * canonical id 不外露給前端（前端無需感知 alias）。僅用於已填卡的格位。
 */
export function toDisplaySlot(slot: RawSlotForDisplay): SlotWithCard {
  const identity = slot.displayCard ?? slot.card!
  const canonical = slot.card!
  return {
    id: slot.id,
    binderId: slot.binderId,
    cardId: identity.id,
    pageNumber: slot.pageNumber,
    slotIndex: slot.slotIndex,
    status: slot.status as 'owned' | 'wanted',
    card: { ...identity, imageSmall: canonical.imageSmall },
  }
}
