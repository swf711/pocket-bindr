import { test, expect } from './helpers/test'
import { prisma } from '../src/lib/prisma'
import { getTestUser, loginAs } from './helpers/auth'
import {
  getUserIdByEmail,
  createMultiPageBinder,
  cleanupBinder,
  getTwoCardIds,
  getCardWithImage,
  getOpcgZhTwAliasCard,
} from './helpers/db'

const USER = getTestUser('binderviewimprove')

test.describe('卡冊詳情頁改善', () => {
  test('詳情頁顯示返回按鈕，點擊後導向 /binders', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 1 })
    try {
      await page.goto(`/binders/${binder.id}`)
      const backBtn = page.getByTestId('back-to-binders')
      await expect(backBtn).toBeVisible()
      await backBtn.click()
      await expect(page).toHaveURL(/\/binders$/)
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('內頁面板固定為 M3 dark surface-container（不受淺色模式影響）', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 1 })
    try {
      await page.goto(`/binders/${binder.id}`)
      const spreadView = page.getByTestId('spread-drag-container')
      await expect(spreadView).toBeVisible()
      // 內頁 panel 套 dark + bg-surface-container class（外層 wrapper 套用 coverColor），
      // 強制暗色 surface 不隨全站淺色模式切換（981eeb3 M3 dark 模式背景改色後的現行實作）
      const pagePanel = spreadView.locator('.dark.bg-surface-container').first()
      await expect(pagePanel).toBeVisible()
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('內頁面板外框顏色與 coverColor 一致', async ({ page }) => {
    const coverColor = '#2C5282'
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId, { coverColor, pageCount: 1 })
    try {
      await page.goto(`/binders/${binder.id}`)
      const spreadView = page.getByTestId('spread-drag-container')
      await expect(spreadView).toBeVisible()
      const panel = spreadView.locator('> div').first()
      const borderColor = await panel.evaluate((el) => getComputedStyle(el).borderColor)
      // #2C5282 = rgb(44, 82, 130)
      expect(borderColor).toBe('rgb(44, 82, 130)')
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('Settings Drawer 修改描述儲存後封面面板即時更新', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 1 })
    try {
      await page.goto(`/binders/${binder.id}`)
      const coverPanel = page.getByTestId('binder-cover-panel').first()
      await expect(coverPanel).toBeVisible()

      const desc = `即時更新描述-${Date.now()}`
      await page.getByTestId('binder-settings-btn').first().click()
      await page.locator('#drawer-binder-description').fill(desc)
      await page.getByRole('button', { name: '儲存設定' }).click()

      // 不重新整理，封面面板即顯示新描述
      await expect(coverPanel.getByText(desc)).toBeVisible()
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('管理內頁 Dialog 的頁面卡片整張可拖曳（可 focus，無獨立把手）', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 2 })
    try {
      await page.goto(`/binders/${binder.id}`)
      await page.getByTestId('page-manager-btn').first().click()
      await page.getByTestId('page-manager-list').waitFor()

      const card1 = page.getByTestId('page-manager-row-1')
      const card2 = page.getByTestId('page-manager-row-2')
      await expect(card1).toBeVisible()
      await expect(card2).toBeVisible()

      // 整張卡片即拖曳目標：可 focus（dnd-kit attributes），且不再有獨立把手
      await card2.focus()
      await expect(card2).toBeFocused()
      await expect(page.getByTestId('page-drag-handle-2')).toHaveCount(0)
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('刪除內頁成功後確認 dialog 自動關閉', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 2 })
    try {
      await page.goto(`/binders/${binder.id}`)
      await page.getByTestId('page-manager-btn').first().click()
      await page.getByTestId('page-manager-list').waitFor()

      await page.getByTestId('page-delete-btn-1').click()
      const confirmBtn = page.getByTestId('page-delete-confirm-1')
      await expect(confirmBtn).toBeVisible()
      await confirmBtn.click()

      // 刪除成功後 dialog 應自動關閉（曾是實際回報的 bug：刪除成功但 dialog 未關閉）
      await expect(confirmBtn).not.toBeVisible({ timeout: 8000 })
      await expect(page.getByText(/已刪除/)).toBeVisible()
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('拖拉調整內頁順序後 DB slot 換頁', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const [cardId1, cardId2] = await getTwoCardIds()

    // 建立 2 頁 binder：card1 在 page1，card2 在 page2
    // settings.totalPages 必須設定，否則 settings drawer 頁面列表為空
    const binder = await prisma.binder.create({
      data: { userId, name: 'DnD Page Reorder Test', gridType: 'grid_3x3', coverColor: '#2C5282', settings: { totalPages: 2 } },
    })
    await prisma.userCard.createMany({
      data: [
        { userId, cardId: cardId1, status: 'owned', quantity: 1 },
        { userId, cardId: cardId2, status: 'owned', quantity: 1 },
      ],
    })
    const slot1 = await prisma.binderSlot.create({
      data: { binderId: binder.id, cardId: cardId1, status: 'owned', pageNumber: 1, slotIndex: 0 },
    })
    const slot2 = await prisma.binderSlot.create({
      data: { binderId: binder.id, cardId: cardId2, status: 'owned', pageNumber: 2, slotIndex: 0 },
    })

    try {
      await page.goto(`/binders/${binder.id}`)
      await page.getByTestId('page-manager-btn').first().click()

      const list = page.getByTestId('page-manager-list')
      await expect(list).toBeVisible()

      // drag page row 2 up to page row 1
      const row1 = page.getByTestId('page-manager-row-1')
      const row2 = page.getByTestId('page-manager-row-2')
      await expect(row1).toBeVisible()
      await expect(row2).toBeVisible()

      // 整張卡片即拖曳目標（無獨立把手），dnd-kit 的 attributes 使其可 focus。
      // 用 KeyboardSensor 觸發排序（比滑鼠事件更穩定）：
      // Space 拾起 → ArrowLeft 移到前一個位置 → Space 放下
      // ⚠️ rectSortingStrategy 的 coordinate getter 是 2D：ArrowUp 是「上一列」，
      // 要移到「上一個位置」得用 ArrowLeft
      const card2 = page.getByTestId('page-manager-row-2')
      await card2.focus()
      await card2.press('Space')
      await page.waitForTimeout(100)
      await card2.press('ArrowLeft')
      await page.waitForTimeout(50)
      await card2.press('Space')

      // DB poll: slot2 (originally on page 2) should now be on page 1
      await expect
        .poll(
          async () => {
            const s = await prisma.binderSlot.findUnique({ where: { id: slot2.id }, select: { pageNumber: true } })
            return s?.pageNumber
          },
          { timeout: 8000 },
        )
        .toBe(1)

      // slot1 (originally on page 1) should now be on page 2
      await expect
        .poll(
          async () => {
            const s = await prisma.binderSlot.findUnique({ where: { id: slot1.id }, select: { pageNumber: true } })
            return s?.pageNumber
          },
          { timeout: 8000 },
        )
        .toBe(2)
    } finally {
      await prisma.binder.delete({ where: { id: binder.id } }).catch(() => {})
      await prisma.userCard.deleteMany({ where: { userId, cardId: { in: [cardId1, cardId2] } } })
    }
  })
  // ── 內頁管理縮圖預覽 ────────────────────────────────────────────────────────

  test('內頁管理每列顯示該頁縮圖，空白頁不含卡圖', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG')

    // 2 頁，卡只放在第 1 頁 → 第 2 頁是空白頁
    const binder = await prisma.binder.create({
      data: {
        userId,
        name: 'Page Preview Test',
        gridType: 'grid_3x3',
        coverColor: '#2C5282',
        settings: { totalPages: 2 },
      },
    })
    await prisma.userCard.upsert({
      where: { userId_cardId_status: { userId, cardId: card.id, status: 'owned' } },
      create: { userId, cardId: card.id, status: 'owned', quantity: 1 },
      update: {},
    })
    await prisma.binderSlot.create({
      data: { binderId: binder.id, cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 },
    })

    try {
      await page.goto(`/binders/${binder.id}`)
      await page.getByTestId('page-manager-btn').first().click()
      await page.getByTestId('page-manager-list').waitFor()

      const preview1 = page.getByTestId('page-preview-1')
      const preview2 = page.getByTestId('page-preview-2')
      await expect(preview1).toBeAttached()
      await expect(preview2).toBeAttached()

      // 第 1 頁有卡 → 有卡圖；第 2 頁全空 → 只有佔位色塊
      await expect(preview1.locator('img')).toHaveCount(1)
      await expect(preview2.locator('img')).toHaveCount(0)
      // 9 格皆 render（1 張卡 + 8 個空格）
      await expect(preview1.locator('> div')).toHaveCount(9)
    } finally {
      await cleanupBinder(binder.id)
      await prisma.userCard.deleteMany({ where: { userId, cardId: card.id } })
    }
  })

  test('拖曳重排內頁後，縮圖跟著該頁移動', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG')

    // 卡放在第 2 頁；重排後第 2 頁變第 1 頁，第一列的縮圖應出現卡圖
    const binder = await prisma.binder.create({
      data: {
        userId,
        name: 'Page Preview Reorder Test',
        gridType: 'grid_3x3',
        coverColor: '#2C5282',
        settings: { totalPages: 2 },
      },
    })
    await prisma.userCard.upsert({
      where: { userId_cardId_status: { userId, cardId: card.id, status: 'owned' } },
      create: { userId, cardId: card.id, status: 'owned', quantity: 1 },
      update: {},
    })
    await prisma.binderSlot.create({
      data: { binderId: binder.id, cardId: card.id, status: 'owned', pageNumber: 2, slotIndex: 0 },
    })

    try {
      await page.goto(`/binders/${binder.id}`)
      await page.getByTestId('page-manager-btn').first().click()
      await page.getByTestId('page-manager-list').waitFor()

      await expect(page.getByTestId('page-preview-1').locator('img')).toHaveCount(0)
      await expect(page.getByTestId('page-preview-2').locator('img')).toHaveCount(1)

      // KeyboardSensor 比滑鼠事件穩定（沿用同檔既有重排測試的手法）
      // 整張卡片即拖曳目標（無獨立把手）；ArrowLeft = 上一個位置（2D grid 語意）
      const card2 = page.getByTestId('page-manager-row-2')
      await card2.focus()
      await card2.press('Space')
      await page.waitForTimeout(100)
      await card2.press('ArrowLeft')
      await page.waitForTimeout(50)
      await card2.press('Space')

      // 重排後第一列（第 1 頁）才是有卡的那一頁
      await expect(page.getByTestId('page-preview-1').locator('img')).toHaveCount(1, {
        timeout: 8000,
      })
      await expect(page.getByTestId('page-preview-2').locator('img')).toHaveCount(0)
    } finally {
      await cleanupBinder(binder.id)
      await prisma.userCard.deleteMany({ where: { userId, cardId: card.id } })
    }
  })

  // ── reorder-bulk 顯示身份迴歸 ───────────────────────────────────────────────

  test('重排內頁的回應保留 alias 顯示身份與跨格 span', async ({ page }) => {
    const alias = await getOpcgZhTwAliasCard()
    test.skip(alias === null, '此環境的卡牌 seed 無 OPCG ZH_TW alias 卡')

    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)

    const binder = await prisma.binder.create({
      data: {
        userId,
        name: 'Reorder Display Identity Test',
        gridType: 'grid_3x3',
        coverColor: '#2C5282',
        settings: { totalPages: 2 },
      },
    })
    // 第 1 頁：alias 卡（cardId = canonical JA、displayCardId = ZH_TW alias）
    await prisma.userCard.upsert({
      where: { userId_cardId_status: { userId, cardId: alias!.jaCardId, status: 'owned' } },
      create: { userId, cardId: alias!.jaCardId, status: 'owned', quantity: 1 },
      update: {},
    })
    await prisma.binderSlot.create({
      data: {
        binderId: binder.id,
        cardId: alias!.jaCardId,
        displayCardId: alias!.zhTwCardId,
        status: 'owned',
        pageNumber: 1,
        slotIndex: 0,
      },
    })
    // 第 2 頁：跨格群組（左右兩格）
    const spanCard = await getCardWithImage('PTCG')
    const group = await prisma.binderSlotGroup.create({
      data: { binderId: binder.id, cols: 2, rows: 1, rotation: 270 },
    })
    await prisma.userCard.upsert({
      where: { userId_cardId_status: { userId, cardId: spanCard.id, status: 'owned' } },
      create: { userId, cardId: spanCard.id, status: 'owned', quantity: 1 },
      update: {},
    })
    await prisma.binderSlot.createMany({
      data: [0, 1].map((i) => ({
        binderId: binder.id,
        cardId: spanCard.id,
        status: 'owned' as const,
        pageNumber: 2,
        slotIndex: i,
        groupId: group.id,
        groupIndex: i,
      })),
    })

    try {
      await page.goto(`/binders/${binder.id}`)
      await page.getByTestId('page-manager-btn').first().click()
      await page.getByTestId('page-manager-list').waitFor()

      const responsePromise = page.waitForResponse(
        (r) => r.url().includes('/pages/reorder-bulk') && r.request().method() === 'PATCH',
      )
      // 整張卡片即拖曳目標（無獨立把手）；ArrowLeft = 上一個位置（2D grid 語意）
      const card2 = page.getByTestId('page-manager-row-2')
      await card2.focus()
      await card2.press('Space')
      await page.waitForTimeout(100)
      await card2.press('ArrowLeft')
      await page.waitForTimeout(50)
      await card2.press('Space')

      const body = await (await responsePromise).json()
      const slots: Array<{
        cardId: string
        card: { language: string }
        span: { cols: number; rows: number } | null
      }> = body.slots

      // alias 格位以顯示身份回傳（曾因自寫 select 缺 displayCard 而退回 canonical JA）
      const aliasSlot = slots.find((s) => s.cardId === alias!.zhTwCardId)
      expect(aliasSlot, 'alias 格位應以 ZH_TW 顯示身份回傳').toBeTruthy()
      expect(aliasSlot!.card.language).toBe('ZH_TW')

      // 跨格群組資訊不再掉失（曾因缺 group 而讓 span 變成 null）
      const spanSlots = slots.filter((s) => s.span !== null)
      expect(spanSlots).toHaveLength(2)
      expect(spanSlots[0].span).toMatchObject({ cols: 2, rows: 1 })
    } finally {
      await cleanupBinder(binder.id)
      await prisma.userCard.deleteMany({
        where: { userId, cardId: { in: [alias!.jaCardId, spanCard.id] } },
      })
    }
  })
  test('點擊頁面卡片關閉 Dialog 並跳到該頁', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)

    // 4 頁：第 1 頁與第 4 頁不同 spread（page 4 在 spread 2），可驗證確實翻過去了
    const binder = await prisma.binder.create({
      data: {
        userId,
        name: 'Jump To Page Test',
        gridType: 'grid_3x3',
        coverColor: '#2C5282',
        settings: { totalPages: 4 },
      },
    })

    try {
      await page.goto(`/binders/${binder.id}`)
      const spread = page.getByTestId('binder-spread-view')
      // 初始在 spread 0（封面 + 第 1 頁）
      await expect(spread.getByText('第 1 頁')).toBeVisible()

      await page.getByTestId('page-manager-btn').first().click()
      await page.getByTestId('page-manager-list').waitFor()
      // 跳頁鈕是 hover 才顯示的 overlay，需先 hover 卡片本體
      await page.getByTestId('page-manager-row-4').hover()
      await page.getByTestId('page-jump-btn-4').click()

      // Dialog 關閉，且已翻到第 4 頁所在的 spread
      await expect(page.getByTestId('page-manager-dialog')).not.toBeVisible()
      await expect(spread.getByText('第 4 頁')).toBeVisible()
      await expect(spread.getByText('第 1 頁')).not.toBeVisible()
    } finally {
      await cleanupBinder(binder.id)
    }
  })
  test('header 三顆按鈕外框與 icon 尺寸一致（M3 pill + icon size 迴歸）', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 1 })
    try {
      await page.goto(`/binders/${binder.id}`)

      // Radix 巢狀 asChild 會讓外層 trigger 的 data-slot 蓋掉內層 Button 的，
      // globals.css 的 M3 pill override 需明列每種 trigger；漏列 dialog-trigger 時
      // 這顆按鈕會渲染成圓角方形而非圓形（實際發生過的缺陷）。
      const radiusOf = async (testId: string) =>
        page
          .getByTestId(testId)
          .first()
          .evaluate((el) => getComputedStyle(el).borderTopLeftRadius)

      const refreshRadius = await radiusOf('binder-refresh-btn')
      const pageManagerRadius = await radiusOf('page-manager-btn')
      const settingsRadius = await radiusOf('binder-settings-btn')

      expect(pageManagerRadius).toBe(refreshRadius)
      expect(settingsRadius).toBe(refreshRadius)
      // pill override 指定 9999px（computed 值不會被夾），非 pill 時是 8px 的圓角方形
      expect(parseFloat(refreshRadius)).toBeGreaterThanOrEqual(9999)

      // 按鈕外框一致還不夠——icon 尺寸不一致同樣會看起來沒對齊（齒輪原為 size-5、
      // 另兩顆吃 Button cva 預設的 size-4，實際回報「還是沒對齊」的就是這個）
      const boxOf = async (testId: string) =>
        page
          .getByTestId(testId)
          .first()
          .evaluate((el) => {
            const b = el.getBoundingClientRect()
            const svg = el.querySelector('svg')!.getBoundingClientRect()
            return { btn: `${Math.round(b.width)}x${Math.round(b.height)}`, icon: `${Math.round(svg.width)}x${Math.round(svg.height)}` }
          })

      const refreshBox = await boxOf('binder-refresh-btn')
      expect(await boxOf('page-manager-btn')).toEqual(refreshBox)
      expect(await boxOf('binder-settings-btn')).toEqual(refreshBox)
      expect(refreshBox).toEqual({ btn: '40x40', icon: '20x20' })
    } finally {
      await cleanupBinder(binder.id)
    }
  })
})
