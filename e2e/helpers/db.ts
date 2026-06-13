import 'dotenv/config'
import { prisma } from '../../src/lib/prisma'
import { TEST_USER } from './auth'

/**
 * 清除指定 email 帳號的所有 user_cards 紀錄，
 * 確保收藏相關測試之間互不影響。
 */
export async function clearUserCardsByEmail(email: string): Promise<void> {
  await prisma.userCard.deleteMany({
    where: { user: { email } },
  })
}

/**
 * 清除指定 email 帳號的所有 binders（含 slots），
 * 確保卡冊相關測試之間互不影響。
 */
export async function clearUserBindersByEmail(email: string): Promise<void> {
  await prisma.binder.deleteMany({
    where: { user: { email } },
  })
}

/**
 * 取得指定 email 帳號的 userId（帳號需已存在，通常由 loginAs 註冊）。
 */
export async function getUserIdByEmail(email: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { email } })
  return user.id
}

// ---- 舊 API（保留為 wrapper，未遷移的呼叫點繼續可用）----

/** @deprecated 改用 clearUserCardsByEmail(user.email) */
export async function clearTestUserCards() {
  await clearUserCardsByEmail(TEST_USER.email)
}

/** @deprecated 改用 clearUserBindersByEmail(user.email) */
export async function clearTestUserBinders() {
  await clearUserBindersByEmail(TEST_USER.email)
}

/**
 * 清除指定 userId 的所有 UserCard 紀錄。
 */
export async function cleanUserCards(userId: string) {
  await prisma.userCard.deleteMany({ where: { userId } })
}

/**
 * 清除指定 binderId 的所有 BinderSlot 紀錄。
 */
export async function cleanBinderSlots(binderId: string) {
  await prisma.binderSlot.deleteMany({ where: { binderId } })
}

/**
 * 建立含格位的卡冊，供 binder-view E2E 測試使用。
 */
export async function createBinderWithSlots(
  userId: string,
  gridType: string,
  slotData: Array<{ cardId: string; status: 'owned' | 'wanted'; pageNumber: number; slotIndex: number }>,
): Promise<{ binder: { id: string }; slots: Array<{ id: string }> }> {
  const binder = await prisma.binder.create({
    data: { userId, name: 'E2E Test Binder', gridType: gridType as never },
  })
  const slots = await Promise.all(
    slotData.map((s) =>
      prisma.binderSlot.create({
        data: { binderId: binder.id, cardId: s.cardId, status: s.status as never, pageNumber: s.pageNumber, slotIndex: s.slotIndex },
      }),
    ),
  )
  return { binder, slots }
}

/**
 * 取得兩張不同且有圖片的卡片 id，供 DnD E2E 測試使用。
 */
export async function getTwoCardIds(): Promise<[string, string]> {
  const cards = await prisma.card.findMany({
    where: { imageSmall: { not: '' } },
    take: 2,
  })
  if (cards.length < 2) {
    throw new Error('getTwoCardIds: 資料庫中不足兩張有圖片的卡片')
  }
  return [cards[0].id, cards[1].id]
}

/**
 * 取得一組 OPCG ZH_TW alias 卡資料，供 alias E2E 測試使用。
 * 若環境中無 OPCG 資料則回傳 null（CI 環境可跳過）。
 */
export async function getOpcgZhTwAliasCard(): Promise<{
  zhTwCardId: string
  jaCardId: string
  externalId: string
} | null> {
  const aliasCard = await prisma.card.findFirst({
    where: { game: 'OPCG', language: 'ZH_TW', isCollectible: false, canonicalCardId: { not: null } },
    select: { id: true, canonicalCardId: true, externalId: true },
  })
  if (!aliasCard || !aliasCard.canonicalCardId) return null
  return {
    zhTwCardId: aliasCard.id,
    jaCardId: aliasCard.canonicalCardId,
    externalId: aliasCard.externalId,
  }
}

/**
 * 刪除指定卡冊（含所有 BinderSlot，由 cascade 處理）。
 */
export async function cleanupBinder(binderId: string): Promise<void> {
  await prisma.binder.delete({ where: { id: binderId } }).catch(() => {})
}

/**
 * 建立含多頁格位的卡冊，供 spread layout E2E 測試使用。
 * 建立足夠的格位讓 grid 分成多頁（預設 grid_3x3，9格/頁，建立 2+ 頁）。
 * 回傳值含 slots（每頁 slotIndex 0 各一格），供 DnD 測試以 slot id 斷言。
 */
export async function createMultiPageBinder(
  userId: string,
  options: {
    name?: string
    coverColor?: string
    gridType?: string
    pageCount?: number
  } = {},
): Promise<{
  binder: { id: string; coverColor: string }
  slots: Array<{ id: string; pageNumber: number; slotIndex: number }>
}> {
  const {
    name = 'Multi-Page Test Binder',
    coverColor = '#2C5282',
    gridType = 'grid_3x3',
    pageCount = 2,
  } = options

  const binder = await prisma.binder.create({
    data: { userId, name, gridType: gridType as never, coverColor },
  })

  // Find a card with an image to use in slots
  const card = await prisma.card.findFirst({ where: { imageSmall: { not: '' } } })
  let slots: Array<{ id: string; pageNumber: number; slotIndex: number }> = []
  if (card) {
    // Add a userCard so slots are valid
    await prisma.userCard.upsert({
      where: { userId_cardId_status: { userId, cardId: card.id, status: 'owned' } },
      create: { userId, cardId: card.id, status: 'owned', quantity: pageCount },
      update: { quantity: pageCount },
    })

    // Create one slot per page so we have enough pages
    slots = await Promise.all(
      Array.from({ length: pageCount }, (_, i) =>
        prisma.binderSlot.create({
          data: { binderId: binder.id, cardId: card.id, status: 'owned', pageNumber: i + 1, slotIndex: 0 },
          select: { id: true, pageNumber: true, slotIndex: true },
        }),
      ),
    )
  }

  return { binder: { id: binder.id, coverColor }, slots }
}
