// Requires running server and test database
import { test, expect } from './helpers/test'
import { getTestUser, loginAs } from './helpers/auth'
import { dropOn, startDrag } from './helpers/drag'
import {
  clearUserBindersByEmail,
  clearUserCardsByEmail,
  countBinderSlotGroups,
  createBinderWithSlots,
  getBinderSlotPositions,
  getCardWithImage,
  getMultiNumberCard,
  getUserCardQuantity,
  getSlotIdAt,
  getUserIdByEmail,
} from './helpers/db'

const USER = getTestUser('bindermulticardspan')

/** 透過 API 加入卡冊（跨格放置邏輯在後端，UI 路徑另有既有 spec 覆蓋）。 */
async function addCardToBinder(
  page: import('@playwright/test').Page,
  binderId: string,
  cardId: string,
  status: 'owned' | 'wanted' = 'owned',
) {
  const res = await page.request.post(`/api/binders/${binderId}/cards`, {
    data: { cardId, status, quantity: 1 },
  })
  expect(res.ok()).toBe(true)
}

test.describe('複數卡跨格位呈現', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
  })

  test.afterAll(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
  })

  test('V-UNION 加入 3×3 卡冊佔左上 2×2 四格，quantity 仍記 1', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getMultiNumberCard('vunion')
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [], { totalPages: 1 })

    await addCardToBinder(page, binder.id, card.id)

    const positions = await getBinderSlotPositions(binder.id, card.id)
    expect(positions.map((p) => p.slotIndex)).toEqual([0, 1, 3, 4])
    expect(positions.every((p) => p.pageNumber === 1)).toBe(true)
    expect(positions.map((p) => p.groupIndex)).toEqual([0, 1, 2, 3])

    // 一組實體多卡仍只算一張
    expect(await getUserCardQuantity(userId, card.id, 'owned')).toBe(1)
    expect(await countBinderSlotGroups(binder.id)).toBe(1)

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()
    await expect(view.locator('[data-testid^="slot-card-"]')).toHaveCount(4)
  })

  test('跨格的卡圖實際放大到 N 倍格位寬高（防 max-width 夾擠回歸）', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getMultiNumberCard('vunion')
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [], { totalPages: 1 })
    await addCardToBinder(page, binder.id, card.id)

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()
    const slots = view.locator('[data-testid^="slot-card-"]')
    await expect(slots).toHaveCount(4)
    // 等格位卡圖實際載入（未載入時 replaced element 的尺寸尚未定案）。
    // 只看格位內的圖，不看整頁 document.images——頁首頭像等圖片與本測試無關。
    await expect
      .poll(
        async () =>
          page.evaluate(() =>
            [...document.querySelectorAll('[data-testid^="slot-card-"] img')].every(
              (i) => (i as HTMLImageElement).complete,
            ),
          ),
        { timeout: 15000 },
      )
      .toBe(true)

    // 2×2 群組的每格都必須把來源圖放大成 2 倍格位寬 × 2 倍格位高，否則 col=1／row=1 的
    // 格位會顯示空白（Tailwind preflight 的 img{max-width:100%} 曾把 width:200% 夾成 100%）
    const ratios = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('[data-testid^="slot-card-"]')]
      return cards.map((c) => {
        const img = c.querySelector('img') as HTMLImageElement
        const box = img.parentElement as HTMLElement
        return [
          img.getBoundingClientRect().width / box.getBoundingClientRect().width,
          img.getBoundingClientRect().height / box.getBoundingClientRect().height,
        ]
      })
    })
    expect(ratios).toHaveLength(4)
    for (const [wRatio, hRatio] of ratios) {
      expect(wRatio).toBeCloseTo(2, 1)
      expect(hRatio).toBeCloseTo(2, 1)
    }
  })

  test('LEGEND 佔左右兩格', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getMultiNumberCard('legend')
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [], { totalPages: 1 })

    await addCardToBinder(page, binder.id, card.id)

    const positions = await getBinderSlotPositions(binder.id, card.id)
    expect(positions.map((p) => p.slotIndex)).toEqual([0, 1])
    expect(positions.every((p) => p.pageNumber === 1)).toBe(true)
  })

  test('スタジアム（Trainer）同樣佔左右兩格', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getMultiNumberCard('stadium')
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [], { totalPages: 1 })

    await addCardToBinder(page, binder.id, card.id)

    const positions = await getBinderSlotPositions(binder.id, card.id)
    expect(positions.map((p) => p.slotIndex)).toEqual([0, 1])
  })

  test('同頁湊不出連續矩形時整組移到下一頁，不硬塞零星空格', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getMultiNumberCard('vunion')
    const filler = await getCardWithImage('PTCG', 'EN')
    // 3×3 頁面上以間隔方式填卡，讓任何 2×2 矩形都至少含一張卡
    const { binder } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [0, 2, 4, 6, 8].map((slotIndex) => ({
        cardId: filler.id,
        status: 'owned' as const,
        pageNumber: 1,
        slotIndex,
      })),
      { totalPages: 2 },
    )

    await addCardToBinder(page, binder.id, card.id)

    const positions = await getBinderSlotPositions(binder.id, card.id)
    expect(positions.every((p) => p.pageNumber === 2)).toBe(true)
    expect(positions.map((p) => p.slotIndex)).toEqual([0, 1, 3, 4])
  })

  test('grid_1x2（僅 1 欄）放不下跨格形狀，退回單格', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getMultiNumberCard('vunion')
    const { binder } = await createBinderWithSlots(userId, 'grid_1x2', [], { totalPages: 1 })

    await addCardToBinder(page, binder.id, card.id)

    const positions = await getBinderSlotPositions(binder.id, card.id)
    expect(positions).toHaveLength(1)
    expect(positions[0].groupIndex).toBeNull()
    expect(await countBinderSlotGroups(binder.id)).toBe(0)
  })

  test('切回單格再切回跨格', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getMultiNumberCard('vunion')
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [], { totalPages: 1 })
    await addCardToBinder(page, binder.id, card.id)

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()
    await expect(view.locator('[data-testid^="slot-card-"]')).toHaveCount(4)

    const anchorId = (await getBinderSlotPositions(binder.id, card.id)).length
    expect(anchorId).toBe(4)

    // 收合為單格
    const firstSlot = view.locator('[data-testid^="slot-card-"]').first()
    await firstSlot.hover()
    // 此 viewport 下格位視覺寬度塞不下橫排按鈕，跨格切換收進 ⋯ 選單（選單 portal 至 body，故於 page 取）
    await view.locator('[data-testid^="slot-more-btn-"]').first().click()
    await page.locator('[data-testid^="slot-span-menu-"]').click()
    await expect(view.locator('[data-testid^="slot-card-"]')).toHaveCount(1)
    // UI 走樂觀更新（先變再送出），DB 斷言一律輪詢，不可直接讀一次
    await expect.poll(async () => countBinderSlotGroups(binder.id)).toBe(0)
    expect(await getUserCardQuantity(userId, card.id, 'owned')).toBe(1)

    // 再展開回跨格
    await view.locator('[data-testid^="slot-card-"]').first().hover()
    await view.locator('[data-testid^="slot-more-btn-"]').first().click()
    await page.locator('[data-testid^="slot-span-menu-"]').click()
    await expect(view.locator('[data-testid^="slot-card-"]')).toHaveCount(4)
    await expect.poll(async () => countBinderSlotGroups(binder.id)).toBe(1)
    await expect
      .poll(async () => (await getBinderSlotPositions(binder.id, card.id)).length)
      .toBe(4)
    expect(await getUserCardQuantity(userId, card.id, 'owned')).toBe(1)
  })

  test('拖曳整組：幽靈顯示整組範圍，落點依抓取的那一格反推左上角', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getMultiNumberCard('vunion')
    // 3×3、群組在左上 2×2（index 0,1,3,4）
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [], { totalPages: 1 })
    await addCardToBinder(page, binder.id, card.id)

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()
    await expect(view.locator('[data-testid^="slot-card-"]')).toHaveCount(4)

    // 抓住群組右下角那格（groupIndex 3，位於 slotIndex 4）
    const before = await getBinderSlotPositions(binder.id, card.id)
    expect(before.find((p) => p.groupIndex === 3)!.slotIndex).toBe(4)
    const bottomRightId = await getSlotIdAt(binder.id, 1, 4)
    const source = view.getByTestId(`slot-card-${bottomRightId}`)

    await startDrag(page, source)
    // 拖曳幽靈顯示整組（4 格），不是被抓住的單一格
    await expect(page.locator('[data-testid="drag-overlay-card"]')).toHaveCount(4)

    // 放到 slotIndex 8（右下角）→ 依抓取偏移反推左上角 = index 4，整組佔 {4,5,7,8}
    await dropOn(page, view.locator('[data-page="1"][data-index="8"]'))

    await expect
      .poll(async () => (await getBinderSlotPositions(binder.id, card.id)).map((p) => p.slotIndex))
      .toEqual([4, 5, 7, 8])
    expect(await countBinderSlotGroups(binder.id)).toBe(1)
  })

  test('刪除任一格＝刪整組，quantity 只扣 1', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getMultiNumberCard('vunion')
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [], { totalPages: 1 })
    await addCardToBinder(page, binder.id, card.id)

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()
    await expect(view.locator('[data-testid^="slot-card-"]')).toHaveCount(4)

    await view.locator('[data-testid^="slot-card-"]').first().hover()
    // 此 viewport 下格位視覺寬度塞不下橫排按鈕，刪除收進 ⋯ 選單（選單 portal 至 body，故於 page 取）
    await view.locator('[data-testid^="slot-more-btn-"]').first().click()
    await page.locator('[data-testid^="slot-remove-menu-"]').click()
    await page.getByRole('button', { name: '確認移除' }).click()

    await expect(view.locator('[data-testid^="slot-card-"]')).toHaveCount(0)
    expect(await getBinderSlotPositions(binder.id, card.id)).toHaveLength(0)
    expect(await getUserCardQuantity(userId, card.id, 'owned')).toBeNull()
    expect(await countBinderSlotGroups(binder.id)).toBe(0)
  })

  test('公開分享頁唯讀呈現同樣跨格', async ({ page, context }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getMultiNumberCard('vunion')
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [], { totalPages: 1 })
    await addCardToBinder(page, binder.id, card.id)

    const shareRes = await page.request.post(`/api/binders/${binder.id}/share`)
    expect(shareRes.ok()).toBe(true)
    const { shareToken } = await shareRes.json()

    // 以未登入 context 瀏覽公開頁
    const guest = await context.browser()!.newPage()
    await guest.goto(`/b/${shareToken}`)
    await expect(guest.locator('img').first()).toBeVisible({ timeout: 10000 })
    await guest.close()
  })

  test('切換卡冊格式時跨格群組盡力保留，放不下才拆成單格', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getMultiNumberCard('vunion')
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [], { totalPages: 1 })
    await addCardToBinder(page, binder.id, card.id)

    // 3×3 → 4×4：欄數改變會打散矩形，但新格線容得下 → 整組搬到新的 2×2
    const grow = await page.request.patch(`/api/binders/${binder.id}`, {
      data: { gridType: 'grid_4x4' },
    })
    expect(grow.ok()).toBe(true)
    expect(await countBinderSlotGroups(binder.id)).toBe(1)
    expect((await getBinderSlotPositions(binder.id, card.id)).map((p) => p.slotIndex)).toEqual([
      0, 1, 4, 5,
    ])

    // → grid_1x2（僅 1 欄）：容不下任何跨格形狀 → 拆回單格，卡片仍在
    const shrink = await page.request.patch(`/api/binders/${binder.id}`, {
      data: { gridType: 'grid_1x2' },
    })
    expect(shrink.ok()).toBe(true)
    expect(await countBinderSlotGroups(binder.id)).toBe(0)
    // 拆組只留 anchor 一格（其餘成員是同一張實體卡的其他區塊），quantity 不變
    const after = await getBinderSlotPositions(binder.id, card.id)
    expect(after).toHaveLength(1)
    expect(after[0].groupIndex).toBeNull()
    expect(await getUserCardQuantity(userId, card.id, 'owned')).toBe(1)
  })
})
