import 'dotenv/config'
import bcrypt from 'bcryptjs'
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
  options: { totalPages?: number } = {},
): Promise<{ binder: { id: string }; slots: Array<{ id: string }> }> {
  const binder = await prisma.binder.create({
    data: {
      userId,
      name: 'E2E Test Binder',
      gridType: gridType as never,
      ...(options.totalPages ? { settings: { totalPages: options.totalPages } } : {}),
    },
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
 * 取得一張指定遊戲、有圖片的卡牌，供「已存在收藏狀態」相關 E2E 測試使用。
 */
export async function getCardWithImage(
  game: 'PTCG' | 'OPCG',
  language: 'EN' | 'JA' | 'ZH_TW' = 'ZH_TW',
): Promise<{ id: string; name: string; language: string; externalId: string; imageSmall: string }> {
  const card = await prisma.card.findFirstOrThrow({
    where: { game, language, imageSmall: { not: '' } },
  })
  return {
    id: card.id,
    name: card.name,
    language: card.language,
    externalId: card.externalId,
    imageSmall: card.imageSmall,
  }
}

/**
 * 直接於 DB 建立/更新指定使用者對某卡牌的收藏紀錄（略過 UI/API），
 * 供測試「登入前 DB 已有收藏狀態」的情境快速建立資料。
 */
export async function upsertOwnedUserCard(
  userId: string,
  cardId: string,
  quantity: number,
): Promise<void> {
  await prisma.userCard.upsert({
    where: { userId_cardId_status: { userId, cardId, status: 'owned' } },
    create: { userId, cardId, status: 'owned', quantity },
    update: { quantity },
  })
}

/**
 * 取得兩張不同且有圖片的卡牌 id，供 DnD E2E 測試使用。
 */
export async function getTwoCardIds(): Promise<[string, string]> {
  const cards = await prisma.card.findMany({
    where: { imageSmall: { not: '' } },
    take: 2,
  })
  if (cards.length < 2) {
    throw new Error('getTwoCardIds: 資料庫中不足兩張有圖片的卡牌')
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
 * 重設指定帳號的密碼（供 settings E2E 在修改密碼後還原測試狀態）。
 */
export async function resetUserPassword(email: string, password: string): Promise<void> {
  const hash = await bcrypt.hash(password, 12)
  await prisma.user.update({
    where: { email },
    data: { passwordHash: hash },
  })
}

/**
 * 清除指定帳號的 passwordHash（還原為純 OAuth 狀態），
 * 供「純 OAuth 使用者設定密碼」E2E 在測試間還原狀態。
 */
export async function clearUserPassword(email: string): Promise<void> {
  // updateMany so it's a no-op (not an error) when the user doesn't exist yet.
  await prisma.user.updateMany({
    where: { email },
    data: { passwordHash: null },
  })
}

/**
 * 清除指定 binderId 的 shareToken（撤銷分享），供分享 E2E 測試清理用。
 */
export async function clearBinderShareToken(binderId: string): Promise<void> {
  await prisma.binder.update({ where: { id: binderId }, data: { shareToken: null } }).catch(() => {})
}

/**
 * 重設指定帳號的 username（供 settings E2E 在修改 username 後還原測試狀態）。
 */
export async function resetUserUsername(email: string, username: string | null): Promise<void> {
  await prisma.user.update({
    where: { email },
    data: { username },
  })
}

/**
 * 建立 OAuth-only 測試用戶（無 passwordHash）與對應 Account，回傳 userId。
 * 供無法走 OAuth 真實流程的 E2E 測試使用（如驗證解綁防鎖死 disabled 狀態）。
 * 注意：app 採 `session: { strategy: 'jwt' }`，不使用 DB Session table，
 * 故此處不建立 Session row；登入由 loginAsOAuthUser 注入簽章 JWT cookie 完成。
 */
export async function createOAuthUser(
  email: string,
  username: string,
  provider: 'google' | 'discord',
  providerAccountId: string,
): Promise<{ userId: string }> {
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, username, passwordHash: null },
    update: {},
  })
  await prisma.account.upsert({
    where: { provider_providerAccountId: { provider, providerAccountId } },
    create: { userId: user.id, provider, providerAccountId, type: 'oauth' },
    update: {},
  })
  return { userId: user.id }
}

/**
 * 刪除指定 email 帳號（含所有 Account/Session/UserCard/Binder，由 cascade 處理）。
 * 供 E2E afterAll 清理 OAuth-only 測試帳號，或驗證帳號刪除後重建。
 */
export async function deleteUserByEmail(email: string): Promise<void> {
  await prisma.user.deleteMany({ where: { email } })
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

// ─── Forgot-password E2E helpers ──────────────────────────────────────────────

/**
 * 建立有 email + passwordHash 的測試帳號，供 forgot-password E2E 使用。
 * 若帳號已存在則直接回傳現有 userId。
 */
export async function createPasswordUser(
  email: string,
  username: string,
  password: string,
): Promise<{ userId: string }> {
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, username, passwordHash },
    update: {},
    select: { id: true },
  })
  return { userId: user.id }
}

/**
 * 建立有效的密碼重設 token（直接使用 createResetToken，繞過 email 寄送）。
 * 供 E2E 測試直接導航至 /reset-password?token=... 驗收完整重設流程。
 */
export async function createValidResetToken(email: string): Promise<string> {
  const { createResetToken } = await import('../../src/lib/reset-password')
  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
    select: { id: true, email: true, passwordHash: true },
  })
  if (!user.passwordHash) throw new Error('User has no passwordHash')
  return createResetToken(user.id, user.email!, user.passwordHash)
}

/**
 * 取得指定 email 帳號目前的 passwordHash（供驗證重設後 hash 是否改變）。
 */
export async function getUserPasswordHash(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { passwordHash: true },
  })
  return user?.passwordHash ?? null
}
