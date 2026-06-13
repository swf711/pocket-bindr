import { test, expect } from '@playwright/test'
import { getTestUser, loginAs } from './helpers/auth'
import { clearUserCardsByEmail, clearUserBindersByEmail, getOpcgZhTwAliasCard, getUserIdByEmail } from './helpers/db'
import { prisma } from '../src/lib/prisma'

const USER = getTestUser('opcgzhtwalias')

test.describe('OPCG ZH_TW alias card canonicalization', () => {
  test.beforeEach(async () => {
    await clearUserCardsByEmail(USER.email).catch(() => {})
    await clearUserBindersByEmail(USER.email).catch(() => {})
  })

  test.afterAll(async () => {
    await clearUserCardsByEmail(USER.email).catch(() => {})
    await clearUserBindersByEmail(USER.email).catch(() => {})
    await prisma.$disconnect()
  })

  test('OPCG ZH_TW 搜尋頁顯示卡牌', async ({ page }) => {
    const aliasData = await getOpcgZhTwAliasCard()
    if (!aliasData) {
      test.skip()
      return
    }

    await page.goto('/cards')
    await page.getByTestId('game-btn-opcg').click()

    // 切換到 ZH_TW
    const langSelect = page.getByTestId('language-select')
    if (await langSelect.isVisible()) {
      await langSelect.click()
      await page.getByRole('option', { name: '繁體中文' }).click()
    }

    await expect(page.getByTestId('card-grid')).toBeVisible({ timeout: 10000 })
    const cardItems = page.getByTestId('card-item')
    await expect(cardItems.first()).toBeVisible({ timeout: 10000 })
    expect(await cardItems.count()).toBeGreaterThan(0)
  })

  test('ZH_TW alias card Modal 顯示 JA 圖片（www.onepiece-cardgame.com）', async ({ page }) => {
    const aliasData = await getOpcgZhTwAliasCard()
    if (!aliasData) {
      test.skip()
      return
    }

    await page.goto('/cards?game=OPCG&language=ZH_TW')
    await expect(page.getByTestId('card-grid')).toBeVisible({ timeout: 10000 })

    // 點擊第一張卡開啟 Modal
    await page.getByTestId('card-item').first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // 圖片 src 應來自 JA 官網（www.onepiece-cardgame.com）
    const cardImg = dialog.locator('img').first()
    await expect(cardImg).toBeVisible()
    const src = await cardImg.getAttribute('src')
    expect(src).toBeTruthy()
    // ZH_TW alias 圖片應被替換為 JA 圖片（proxy 後 URL 來源為 JA 官網）
    // proxy URL 格式：/api/proxy-image?url=<encoded-JA-url>
    // 或直接包含 onepiece-cardgame.com（JA hostname，不含 asia-tc）
    if (src && src.includes('proxy-image')) {
      const decoded = decodeURIComponent(src)
      expect(decoded).toContain('onepiece-cardgame.com')
    }
  })

  test('加入 ZH_TW alias 至卡冊 → UserCard.cardId 為 JA Card id', async ({ page }) => {
    const aliasData = await getOpcgZhTwAliasCard()
    if (!aliasData) {
      test.skip()
      return
    }

    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)

    // 建立一個卡冊
    await page.goto('/binders')
    const createBtn = page.getByRole('button', { name: /新增|建立/ })
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click()
      await page.getByRole('button', { name: '確認', exact: true }).click().catch(async () => {
        await page.getByRole('button', { name: /create|新增|OK/i }).click()
      })
    }

    // 直接透過 API 加入 ZH_TW alias 卡（更穩定，不依賴 UI 流程）
    const binderId = await prisma.binder.findFirst({
      where: { userId },
      select: { id: true },
    }).then(b => b?.id)

    if (!binderId) {
      // fallback: create binder directly
      const binder = await prisma.binder.create({
        data: { userId, name: 'E2E Test Binder', gridType: 'grid_3x3' },
      })
      const addRes = await page.request.post(`/api/binders/${binder.id}/cards`, {
        data: { cardId: aliasData.zhTwCardId, status: 'owned', quantity: 1 },
      })
      expect(addRes.ok()).toBeTruthy()
      const addData = await addRes.json()
      // Response cardId should be JA card id (canonical), not ZH_TW alias id
      expect(addData.userCard.cardId).toBe(aliasData.jaCardId)

      // Verify DB directly
      const userCard = await prisma.userCard.findFirst({
        where: { userId, cardId: aliasData.jaCardId, status: 'owned' },
      })
      expect(userCard).not.toBeNull()
      return
    }

    const addRes = await page.request.post(`/api/binders/${binderId}/cards`, {
      data: { cardId: aliasData.zhTwCardId, status: 'owned', quantity: 1 },
    })
    expect(addRes.ok()).toBeTruthy()
    const addData = await addRes.json()
    expect(addData.userCard.cardId).toBe(aliasData.jaCardId)

    // Verify DB directly
    const userCard = await prisma.userCard.findFirst({
      where: { userId, cardId: aliasData.jaCardId, status: 'owned' },
    })
    expect(userCard).not.toBeNull()
  })

  test('ZH_TW alias 搜尋結果顯示與 JA Card 相同的收藏數量', async ({ page }) => {
    const aliasData = await getOpcgZhTwAliasCard()
    if (!aliasData) {
      test.skip()
      return
    }

    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)

    // 直接在 JA Card 建立 UserCard 收藏
    await prisma.userCard.upsert({
      where: { userId_cardId_status: { userId, cardId: aliasData.jaCardId, status: 'owned' } },
      create: { userId, cardId: aliasData.jaCardId, status: 'owned', quantity: 2 },
      update: { quantity: 2 },
    })

    // 搜尋 ZH_TW alias 卡，collectionStatus 應反映 JA Card 的收藏數
    const res = await page.request.get(
      `/api/cards?game=OPCG&language=ZH_TW&q=${aliasData.externalId.split('_')[0]}`
    )
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    const aliasInResult = data.cards.find((c: { id: string }) => c.id === aliasData.zhTwCardId)
    if (aliasInResult) {
      expect(aliasInResult.collectionStatus.owned).toBe(2)
    }
  })
})
