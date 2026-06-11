import 'dotenv/config'
import { prisma } from '../../src/lib/prisma'
import { TEST_USER } from './auth'

/**
 * 清除測試帳號的所有 user_cards 紀錄，
 * 確保收藏相關測試之間互不影響。
 */
export async function clearTestUserCards() {
  await prisma.userCard.deleteMany({
    where: { user: { email: TEST_USER.email } },
  })
}

/**
 * 清除測試帳號的所有 binders（含 slots），
 * 確保卡冊相關測試之間互不影響。
 */
export async function clearTestUserBinders() {
  await prisma.binder.deleteMany({
    where: { user: { email: TEST_USER.email } },
  })
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
 * 刪除指定卡冊（含所有 BinderSlot，由 cascade 處理）。
 */
export async function cleanupBinder(binderId: string): Promise<void> {
  await prisma.binder.delete({ where: { id: binderId } }).catch(() => {})
}
