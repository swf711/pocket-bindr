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
