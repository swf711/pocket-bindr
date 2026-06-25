// Requires running server and test database
import { test, expect } from '@playwright/test'
import { getTestUser, loginAs } from './helpers/auth'
import {
  clearUserBindersByEmail,
  clearUserCardsByEmail,
  createMultiPageBinder,
  createBinderWithSlots,
  getCardWithImage,
  getUserIdByEmail,
} from './helpers/db'

const USER = getTestUser('bindercopyslot')

test.describe('卡冊格位複製卡牌', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
  })

  test.afterAll(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
  })

  test('複製已收錄卡牌至同頁下一個空格', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const { binder, slots } = await createMultiPageBinder(userId, { pageCount: 1 })
    const srcId = slots[0].id

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    // 初始僅 1 張卡
    await expect(view.locator('[data-testid^="slot-card-"]')).toHaveCount(1)

    // hover 來源格位顯示操作列 → 點複製
    await view.getByTestId(`slot-card-${srcId}`).hover()
    await view.getByTestId(`slot-copy-btn-${srcId}`).click()

    await expect(page.getByText(/已複製卡片/)).toBeVisible({ timeout: 5000 })
    // 同頁多出一張相同卡（共 2 張）
    await expect(view.locator('[data-testid^="slot-card-"]')).toHaveCount(2)
  })

  test('複製 wanted 卡仍為黑白圖片', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    const { binder, slots } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [{ cardId: card.id, status: 'wanted', pageNumber: 1, slotIndex: 0 }],
      { totalPages: 1 },
    )
    const srcId = slots[0].id

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await view.getByTestId(`slot-card-${srcId}`).hover()
    await view.getByTestId(`slot-copy-btn-${srcId}`).click()

    await expect(page.getByText(/已複製卡片/)).toBeVisible({ timeout: 5000 })
    // 兩張皆為黑白（wanted）
    await expect(view.locator('img.grayscale')).toHaveCount(2)
  })

  test('整頁填滿後複製自動新增下一頁', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    // grid_1x2：每頁 2 格，填滿單頁
    const { binder, slots } = await createBinderWithSlots(
      userId,
      'grid_1x2',
      [
        { cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 },
        { cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 1 },
      ],
      { totalPages: 1 },
    )
    const srcId = slots[0].id

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await view.getByTestId(`slot-card-${srcId}`).hover()
    await view.getByTestId(`slot-copy-btn-${srcId}`).click()

    await expect(page.getByText(/已複製卡片/)).toBeVisible({ timeout: 5000 })
    // 自動新增第 2 頁並跳至該頁（spread 2 / 2）
    await expect(view.getByText('2 / 2')).toBeVisible({ timeout: 5000 })
    await expect(view.locator('[data-testid^="slot-card-"]')).toHaveCount(1)
  })

  test('行動裝置 tap 複製格位', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const userId = await getUserIdByEmail(USER.email)
    const { binder, slots } = await createMultiPageBinder(userId, { pageCount: 1 })
    const srcId = slots[0].id

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-mobile-view')
    await view.waitFor()

    // 行動版預設在封面頁，往後翻到第 1 頁
    await view.getByTestId('mobile-next-btn').click()
    await expect(view.locator('[data-testid^="slot-card-"]')).toHaveCount(1)

    // tap 格位顯示操作列 → tap 複製
    await view.getByTestId(`slot-card-${srcId}`).click()
    await view.getByTestId(`slot-copy-btn-${srcId}`).click()

    await expect(page.getByText(/已複製卡片/)).toBeVisible({ timeout: 5000 })
  })
})
