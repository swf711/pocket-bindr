import { CardWithCollectionStatus } from '@/types/card'

/**
 * 搜尋列表發佈當前排序後的 cards[]；攔截 modal（card-modal-client.tsx）讀取算 prev/next，
 * 免在 URL 夾帶 filter context。module 級 in-memory，硬重整歸零——比照 last-binder-store.ts，
 * 重整 modal URL 本就落到 real page（無 prev/next 屬預期行為，非 bug）。
 *
 * 訂閱者（listeners）機制：加入卡冊後 collectionStatus 靠列表重抓更新，若 modal 只在掛載時讀一次
 * store 快照，重抓後的新數字進不了已開啟的 modal（曾是實際 E2E 量到的 bug）。改成
 * useSyncExternalStore 可訂閱的 store，讓 modal 對 store 更新保持響應。
 */
let cardNavList: CardWithCollectionStatus[] = []
const listeners = new Set<() => void>()

export function publishCardNavList(cards: CardWithCollectionStatus[]): void {
  cardNavList = cards
  listeners.forEach((listener) => listener())
}

export function subscribeCardNavList(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getCardNavListSnapshot(): CardWithCollectionStatus[] {
  return cardNavList
}

export interface CardNavNeighbors {
  cards: CardWithCollectionStatus[]
  index: number
  total: number
}

/** store 內以 (game, language, externalId) 定位當前卡；找不到（store 空或不在當頁列表）回 null。 */
export function getCardNavNeighbors(
  game: string,
  language: string,
  externalId: string,
): CardNavNeighbors | null {
  if (cardNavList.length === 0) return null
  const index = cardNavList.findIndex(
    (c) => c.game === game && c.language === language && c.externalId === externalId,
  )
  if (index === -1) return null
  return { cards: cardNavList, index, total: cardNavList.length }
}
