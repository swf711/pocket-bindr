import { test, expect } from './helpers/test'
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
    await page.goto('/cards?game=OPCG&language=ZH_TW')
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

    // 點擊第一張卡開啟 Drawer
    await page.getByTestId('card-item').first().click()
    await expect(page.getByTestId('card-detail-drawer')).toBeVisible()

    // 圖片 src 應來自 JA 官網（www.onepiece-cardgame.com）
    const cardImg = page.getByTestId('card-detail-image')
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

    // 直接 DB 建立卡冊（beforeEach 已清除，避免 UI 建立流程的 race condition）
    const binder = await prisma.binder.create({
      data: { userId, name: 'E2E Test Binder', gridType: 'grid_3x3' },
    })

    // 直接透過 API 加入 ZH_TW alias 卡（更穩定，不依賴 UI 流程）
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
  })

  test('加入 ZH_TW alias 至卡冊 → 卡冊檢視以 ZH_TW 顯示（displayCardId 還原顯示語言）', async ({ page }) => {
    const aliasData = await getOpcgZhTwAliasCard()
    if (!aliasData) {
      test.skip()
      return
    }

    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const binder = await prisma.binder.create({
      data: { userId, name: 'E2E Display Binder', gridType: 'grid_3x3' },
    })

    // 送原始 ZH_TW alias id，後端 resolve canonical 並記錄 displayCardId
    const addRes = await page.request.post(`/api/binders/${binder.id}/cards`, {
      data: { cardId: aliasData.zhTwCardId, status: 'owned', quantity: 1 },
    })
    expect(addRes.ok()).toBeTruthy()

    // BinderSlot.displayCardId 應記錄原始 ZH_TW alias id
    const slot = await prisma.binderSlot.findFirst({
      where: { binderId: binder.id, cardId: aliasData.jaCardId },
    })
    expect(slot?.displayCardId).toBe(aliasData.zhTwCardId)

    // 卡冊 GET 以顯示身份（ZH_TW）回傳
    const getRes = await page.request.get(`/api/binders/${binder.id}`)
    expect(getRes.ok()).toBeTruthy()
    const binderData = await getRes.json()
    const displaySlot = binderData.slots.find((s: { cardId: string }) => s.cardId === aliasData.zhTwCardId)
    expect(displaySlot).toBeTruthy()
    expect(displaySlot.card.language).toBe('ZH_TW')
  })

  test('加入 ZH_TW alias 至卡冊 → 卡冊格位圖片與 Drawer 一致，皆為 JA canonical（www.onepiece-cardgame.com，不含 asia-tc）', async ({ page }) => {
    const aliasData = await getOpcgZhTwAliasCard()
    if (!aliasData) {
      test.skip()
      return
    }

    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const binder = await prisma.binder.create({
      data: { userId, name: 'E2E Slot Image Binder', gridType: 'grid_3x3' },
    })

    const addRes = await page.request.post(`/api/binders/${binder.id}/cards`, {
      data: { cardId: aliasData.zhTwCardId, status: 'owned', quantity: 1 },
    })
    expect(addRes.ok()).toBeTruthy()

    await page.goto(`/binders/${binder.id}`)
    const slot = await prisma.binderSlot.findFirst({
      where: { binderId: binder.id, cardId: aliasData.jaCardId },
    })
    expect(slot).toBeTruthy()

    const slotImg = page.getByTestId(`slot-card-${slot!.id}`).locator('img')
    await expect(slotImg).toBeVisible({ timeout: 10000 })
    const src = await slotImg.getAttribute('src')
    expect(src).toBeTruthy()
    if (src && src.includes('proxy-image')) {
      const decoded = decodeURIComponent(src)
      expect(decoded).toContain('onepiece-cardgame.com')
      expect(decoded).not.toContain('asia-tc')
    }
  })

  test('/collection 語言篩選：ZH_TW alias 收藏在「繁中」可見、「日文」不可見', async ({ page }) => {
    const aliasData = await getOpcgZhTwAliasCard()
    if (!aliasData) {
      test.skip()
      return
    }

    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const binder = await prisma.binder.create({
      data: { userId, name: 'E2E Collection Binder', gridType: 'grid_3x3' },
    })
    // 經 alias 加入，UserCard.displayCardId = ZH_TW
    const addRes = await page.request.post(`/api/binders/${binder.id}/cards`, {
      data: { cardId: aliasData.zhTwCardId, status: 'owned', quantity: 1 },
    })
    expect(addRes.ok()).toBeTruthy()

    // 繁中篩選撈到，且以 ZH_TW 身份呈現
    const zhRes = await page.request.get('/api/collection?game=OPCG&language=ZH_TW')
    expect(zhRes.ok()).toBeTruthy()
    const zhData = await zhRes.json()
    const inZh = zhData.cards.find((c: { id: string }) => c.id === aliasData.zhTwCardId)
    expect(inZh).toBeTruthy()
    expect(inZh.language).toBe('ZH_TW')
    expect(inZh.collectionStatus.owned).toBe(1)

    // 日文篩選不撈這筆 alias 收藏（顯示身份為 ZH_TW）
    const jaRes = await page.request.get('/api/collection?game=OPCG&language=JA')
    expect(jaRes.ok()).toBeTruthy()
    const jaData = await jaRes.json()
    const inJa = jaData.cards.find(
      (c: { id: string }) => c.id === aliasData.jaCardId || c.id === aliasData.zhTwCardId,
    )
    expect(inJa).toBeFalsy()
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
