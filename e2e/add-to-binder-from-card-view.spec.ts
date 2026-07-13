// Requires running server and test database
import { test, expect } from './helpers/test'
import { getTestUser, loginAs } from './helpers/auth'
import {
  clearUserBindersByEmail,
  clearUserCardsByEmail,
  createBinderWithSlots,
  getCardWithImage,
  getUserIdByEmail,
} from './helpers/db'

const USER = getTestUser('addfromcardview')

test.describe('查看卡牌時加入卡冊（自己的卡冊詳情頁）', () => {
  test.beforeEach(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
  })

  test.afterAll(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
  })

  test('查看卡牌 → 預選「此卡冊」→ 加入後立即多出對應格位', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    const { binder, slots } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [{ cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 }],
    )

    await page.goto(`/binders/${binder.id}`)

    const view = page.getByTestId('binder-spread-view')
    await expect(view.locator('[data-testid^="slot-card-"]')).toHaveCount(1)

    // hover 格位顯示操作列 → 點「查看」開啟 Drawer
    await view.getByTestId(`slot-card-${slots[0].id}`).hover()
    await view.getByTestId(`slot-view-btn-${slots[0].id}`).click()
    await expect(page.getByTestId('card-detail-drawer')).toBeVisible()

    // 卡冊下拉預選「此卡冊」（E2E Test Binder）
    await expect(page.getByTestId('modal-binder-select')).toContainText('E2E Test Binder')

    // 狀態預設擁有、數量 1 → 加入
    await expect(page.getByTestId('modal-qty-value')).toHaveValue('1')
    await page.getByTestId('modal-add-btn').click()

    // 成功 toast，且不需手動刷新，卡冊立即多出一個格位（1 → 2）
    await expect(page.getByText(/已加入/)).toBeVisible({ timeout: 5000 })
    await expect(view.locator('[data-testid^="slot-card-"]')).toHaveCount(2, { timeout: 8000 })
  })

  test('改選其他卡冊加入 → 成功，當前顯示卡冊格位數不變', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    const { binder, slots } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [{ cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 }],
    )
    // 第二本卡冊（加入目標）
    await createBinderWithSlots(userId, 'grid_3x3', [])

    await page.goto(`/binders/${binder.id}`)

    const view = page.getByTestId('binder-spread-view')
    await view.getByTestId(`slot-card-${slots[0].id}`).hover()
    await view.getByTestId(`slot-view-btn-${slots[0].id}`).click()
    await expect(page.getByTestId('card-detail-drawer')).toBeVisible()

    // 下拉改選另一本卡冊（非當前）
    await page.getByTestId('modal-binder-select').click()
    const options = page.getByRole('option')
    await options.nth(1).click()
    await page.getByTestId('modal-add-btn').click()

    await expect(page.getByText(/已加入/)).toBeVisible({ timeout: 5000 })
    // 當前顯示卡冊未變（仍為 1 格）
    await expect(view.locator('[data-testid^="slot-card-"]')).toHaveCount(1)
  })
})
