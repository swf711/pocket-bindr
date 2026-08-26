// Requires running server and test database
import { test, expect } from './helpers/test'
import { getTestUser, loginAs } from './helpers/auth'
import {
  clearUserBindersByEmail,
  clearUserCardsByEmail,
  countBinderSlotGroups,
  createBinderWithSlots,
  getBinderSlotPositions,
  getBinderTotalPages,
  getCardWithImage,
  getMultiNumberCard,
  getSlotIdAt,
  getSlotPositionById,
  getUserCardQuantity,
  getUserIdByEmail,
} from './helpers/db'

const USER = getTestUser('binderinsertslot')

/** 開啟某格位的 ⋯ 選單並點擊「在此插入空格」（選單 portal 至 body）。 */
async function insertAt(
  page: import('@playwright/test').Page,
  view: import('@playwright/test').Locator,
  slotId: string,
) {
  await view.getByTestId(`slot-card-${slotId}`).hover()
  await view.getByTestId(`slot-more-btn-${slotId}`).click()
  await page.getByTestId(`slot-insert-menu-${slotId}`).click()
}

/** 點空格位右下角的移除鈕（hover 才顯示，故先 hover 整格） */
async function removeEmptyAt(
  view: import('@playwright/test').Locator,
  pageNumber: number,
  slotIndex: number,
) {
  await view.getByTestId(`empty-slot-add-${pageNumber}-${slotIndex}`).hover()
  await view.getByTestId(`empty-slot-remove-${pageNumber}-${slotIndex}`).click()
}

test.describe('卡冊中途插入空格位', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
  })

  test.afterAll(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
  })

  test('在中間插入空格，後面的卡各往後一格、第一個空位之後不受影響', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    const { binder, slots } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [0, 1, 2, 5].map((slotIndex) => ({
        cardId: card.id,
        status: 'owned' as const,
        pageNumber: 1,
        slotIndex,
      })),
      { totalPages: 1 },
    )
    const [s0, s1, s2, s5] = slots

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await insertAt(page, view, s1.id)
    await expect(page.getByText(/已插入空格/)).toBeVisible({ timeout: 5000 })

    expect(await getSlotPositionById(s0.id)).toEqual({ pageNumber: 1, slotIndex: 0 })
    expect(await getSlotPositionById(s1.id)).toEqual({ pageNumber: 1, slotIndex: 2 })
    expect(await getSlotPositionById(s2.id)).toEqual({ pageNumber: 1, slotIndex: 3 })
    // index 4 是第一個空位，其後的卡不動
    expect(await getSlotPositionById(s5.id)).toEqual({ pageNumber: 1, slotIndex: 5 })
    // 純位移，格位張數不變（fixture 直接建 BinderSlot，故以格位數驗證）
    expect(await getBinderSlotPositions(binder.id, card.id)).toHaveLength(4)
  })

  test('頁尾滿時位移串接到下一頁第 0 格', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    // grid_1x2：每頁 2 格
    const { binder, slots } = await createBinderWithSlots(
      userId,
      'grid_1x2',
      [
        { cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 },
        { cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 1 },
      ],
      { totalPages: 2 },
    )
    const [s0, s1] = slots

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await insertAt(page, view, s0.id)
    await expect(page.getByText(/已插入空格/)).toBeVisible({ timeout: 5000 })

    expect(await getSlotPositionById(s0.id)).toEqual({ pageNumber: 1, slotIndex: 1 })
    expect(await getSlotPositionById(s1.id)).toEqual({ pageNumber: 2, slotIndex: 0 })
    expect(await getBinderTotalPages(binder.id)).toBe(2)
  })

  test('卡冊全滿時自動新增一頁後完成插入', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    const { binder, slots } = await createBinderWithSlots(
      userId,
      'grid_1x2',
      [
        { cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 },
        { cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 1 },
      ],
      { totalPages: 1 },
    )
    const [s0, s1] = slots

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await insertAt(page, view, s0.id)
    await expect(page.getByText(/已插入空格/)).toBeVisible({ timeout: 5000 })

    expect(await getSlotPositionById(s0.id)).toEqual({ pageNumber: 1, slotIndex: 1 })
    expect(await getSlotPositionById(s1.id)).toEqual({ pageNumber: 2, slotIndex: 0 })
    expect(await getBinderTotalPages(binder.id)).toBe(2)
  })

  test('位移範圍撞到跨格群組時彈出 Dialog；選「先收合成單格」後完成插入', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const single = await getCardWithImage('PTCG', 'EN')
    const spanCard = await getMultiNumberCard('legend')
    const { binder, slots } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [{ cardId: single.id, status: 'owned', pageNumber: 1, slotIndex: 0 }],
      { totalPages: 1 },
    )
    const [s0] = slots

    // 以既有 API 加入複數卡，讓後端建立真正的跨格群組（落在 index 1、2）
    const res = await page.request.post(`/api/binders/${binder.id}/cards`, {
      data: { cardId: spanCard.id, status: 'owned', quantity: 1 },
    })
    expect(res.ok()).toBe(true)
    expect(await countBinderSlotGroups(binder.id)).toBe(1)

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await insertAt(page, view, s0.id)
    await page.getByTestId('insert-slot-collapse-btn').click()
    await expect(page.getByText(/已插入空格/)).toBeVisible({ timeout: 5000 })

    // 群組被收合、只剩 anchor 一格，且往後推了一格
    expect(await countBinderSlotGroups(binder.id)).toBe(0)
    const spanPositions = await getBinderSlotPositions(binder.id, spanCard.id)
    expect(spanPositions).toHaveLength(1)
    expect(await getSlotPositionById(s0.id)).toEqual({ pageNumber: 1, slotIndex: 1 })
    // 收合不影響張數
    expect(await getUserCardQuantity(userId, spanCard.id, 'owned')).toBe(1)
  })

  test('取消跨格群組 Dialog 後什麼都沒變', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const single = await getCardWithImage('PTCG', 'EN')
    const spanCard = await getMultiNumberCard('legend')
    const { binder, slots } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [{ cardId: single.id, status: 'owned', pageNumber: 1, slotIndex: 0 }],
      { totalPages: 1 },
    )
    const [s0] = slots

    const res = await page.request.post(`/api/binders/${binder.id}/cards`, {
      data: { cardId: spanCard.id, status: 'owned', quantity: 1 },
    })
    expect(res.ok()).toBe(true)

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await insertAt(page, view, s0.id)
    await page.getByRole('button', { name: '取消' }).click()

    expect(await getSlotPositionById(s0.id)).toEqual({ pageNumber: 1, slotIndex: 0 })
    expect(await countBinderSlotGroups(binder.id)).toBe(1)
  })

  test('移除中間的空格，後面的卡各往前一格，第二個空位之後不動', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    const { binder, slots } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [0, 2, 3, 4, 7].map((slotIndex) => ({
        cardId: card.id,
        status: 'owned' as const,
        pageNumber: 1,
        slotIndex,
      })),
      { totalPages: 1 },
    )
    const [s0, s2, s3, s4, s7] = slots

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await removeEmptyAt(view, 1, 1)
    await expect(page.getByText(/已移除空格/)).toBeVisible({ timeout: 5000 })

    expect(await getSlotPositionById(s0.id)).toEqual({ pageNumber: 1, slotIndex: 0 })
    expect(await getSlotPositionById(s2.id)).toEqual({ pageNumber: 1, slotIndex: 1 })
    expect(await getSlotPositionById(s3.id)).toEqual({ pageNumber: 1, slotIndex: 2 })
    expect(await getSlotPositionById(s4.id)).toEqual({ pageNumber: 1, slotIndex: 3 })
    // index 5、6 是空的，index 7 的卡不受影響
    expect(await getSlotPositionById(s7.id)).toEqual({ pageNumber: 1, slotIndex: 7 })
  })

  test('移除空格時往前遞補跨頁', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    // grid_1x2：第 1 頁只有 index 1 有卡、index 0 空；第 2 頁 index 0 有卡
    const { binder, slots } = await createBinderWithSlots(
      userId,
      'grid_1x2',
      [
        { cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 1 },
        { cardId: card.id, status: 'owned', pageNumber: 2, slotIndex: 0 },
      ],
      { totalPages: 2 },
    )
    const [p1s1, p2s0] = slots

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await removeEmptyAt(view, 1, 0)
    await expect(page.getByText(/已移除空格/)).toBeVisible({ timeout: 5000 })

    expect(await getSlotPositionById(p1s1.id)).toEqual({ pageNumber: 1, slotIndex: 0 })
    expect(await getSlotPositionById(p2s0.id)).toEqual({ pageNumber: 1, slotIndex: 1 })
    // 移除空格不會刪頁
    expect(await getBinderTotalPages(binder.id)).toBe(2)
  })

  test('移除空格遇跨格群組時彈出同一個 Dialog；選「先收合成單格」後完成', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const spanCard = await getMultiNumberCard('legend')
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [], { totalPages: 1 })

    // 跨格群組會落在 index 0、1；先插入一格把它推到 index 1、2，讓 index 0 變空格
    const res = await page.request.post(`/api/binders/${binder.id}/cards`, {
      data: { cardId: spanCard.id, status: 'owned', quantity: 1 },
    })
    expect(res.ok()).toBe(true)
    const anchorId = await getSlotIdAt(binder.id, 1, 0)

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await insertAt(page, view, anchorId)
    await page.getByTestId('insert-slot-shift-btn').click()
    await expect(page.getByText(/已插入空格/)).toBeVisible({ timeout: 5000 })
    expect(await getBinderSlotPositions(binder.id, spanCard.id)).toHaveLength(2)

    // 現在 index 0 是空格，其後緊接著跨格群組 → 移除空格應再次彈 Dialog
    await removeEmptyAt(view, 1, 0)
    await page.getByTestId('insert-slot-collapse-btn').click()
    await expect(page.getByText(/已移除空格/)).toBeVisible({ timeout: 5000 })

    expect(await countBinderSlotGroups(binder.id)).toBe(0)
    const positions = await getBinderSlotPositions(binder.id, spanCard.id)
    expect(positions).toHaveLength(1)
    expect(positions[0]).toMatchObject({ pageNumber: 1, slotIndex: 0 })
  })

  test('插入採樂觀更新：API 回應前畫面就已呈現新座標', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    const { binder, slots } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [{ cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 }],
      { totalPages: 1 },
    )
    const [s0] = slots

    // 卡住 API 回應，確認畫面不是等 round-trip 才更新
    let release: () => void = () => {}
    const held = new Promise<void>((resolve) => { release = resolve })
    await page.route('**/slots/insert', async (route) => {
      await held
      await route.continue()
    })

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await insertAt(page, view, s0.id)

    // API 尚未回應，但格位已經移到 index 1（原位置變空格）
    await expect(view.getByTestId('empty-slot-add-1-0')).toBeVisible({ timeout: 3000 })
    await expect(view.getByTestId(`slot-card-${s0.id}`)).toBeVisible()
    expect(await getSlotPositionById(s0.id)).toEqual({ pageNumber: 1, slotIndex: 0 })

    release()
    await expect(page.getByText(/已插入空格/)).toBeVisible({ timeout: 5000 })
    expect(await getSlotPositionById(s0.id)).toEqual({ pageNumber: 1, slotIndex: 1 })
  })

  test('連線失敗時回滾樂觀更新，不留下「看起來成功」的畫面', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    const { binder, slots } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [{ cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 }],
      { totalPages: 1 },
    )
    const [s0] = slots

    // 模擬斷網：fetch 直接拋例外（不是 4xx/5xx response）
    await page.route('**/slots/insert', (route) => route.abort('failed'))

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await insertAt(page, view, s0.id)

    await expect(page.getByText(/插入空格失敗/)).toBeVisible({ timeout: 5000 })
    // 畫面回到原狀：index 0 仍是那張卡、不是空格
    await expect(view.getByTestId('empty-slot-add-1-0')).toHaveCount(0)
    expect(await getSlotPositionById(s0.id)).toEqual({ pageNumber: 1, slotIndex: 0 })

    // 鎖已解開：解除攔截後仍可正常插入
    await page.unroute('**/slots/insert')
    await insertAt(page, view, s0.id)
    await expect(page.getByText(/已插入空格/)).toBeVisible({ timeout: 5000 })
    expect(await getSlotPositionById(s0.id)).toEqual({ pageNumber: 1, slotIndex: 1 })
  })

  test('對空格位相鄰的最後一張卡插入不會把後方的卡往前吸', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    const { binder, slots } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [
        { cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 },
        { cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 4 },
      ],
      { totalPages: 1 },
    )
    const [s0, s4] = slots

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await insertAt(page, view, s0.id)
    await expect(page.getByText(/已插入空格/)).toBeVisible({ timeout: 5000 })

    expect(await getSlotPositionById(s0.id)).toEqual({ pageNumber: 1, slotIndex: 1 })
    expect(await getSlotPositionById(s4.id)).toEqual({ pageNumber: 1, slotIndex: 4 })
    expect(await getSlotIdAt(binder.id, 1, 1)).toBe(s0.id)
  })
})
