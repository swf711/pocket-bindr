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
