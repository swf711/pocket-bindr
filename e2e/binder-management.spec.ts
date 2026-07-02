import { test, expect } from '@playwright/test'
import { getTestUser, loginAs } from './helpers/auth'
import {
  clearUserBindersByEmail,
  clearUserCardsByEmail,
  createBinderWithSlots,
  getCardWithImage,
  getUserIdByEmail,
  upsertOwnedUserCard,
} from './helpers/db'
import { prisma } from '../src/lib/prisma'

const USER = getTestUser('bindermgmt')

test.describe('卡冊管理頁', () => {
  test('未登入導向 /login', async ({ page }) => {
    await page.goto('/binders')
    await expect(page).toHaveURL(/\/login/)
  })

  test('無卡冊時顯示空狀態', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    await expect(page.getByTestId('empty-binder-state').filter({ visible: true })).toBeVisible()
  })

  test('建立新卡冊', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    // 無卡冊時從空狀態按鈕開啟 Dialog
    await page.getByText('建立第一本卡冊').filter({ visible: true }).click()
    await page.getByTestId('binder-name-input').filter({ visible: true }).fill('我的第一本冊')
    // 3×3 為預設格式，不需額外點選
    await page.getByTestId('create-binder-submit').filter({ visible: true }).click()
    await expect(page.getByTestId('binder-card').filter({ visible: true }).first()).toBeVisible()
    await expect(page.getByText('我的第一本冊').filter({ visible: true })).toBeVisible()
  })

  test('編輯卡冊名稱', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    // 先從空狀態建立一本
    await page.getByText('建立第一本卡冊').filter({ visible: true }).click()
    await page.getByTestId('binder-name-input').filter({ visible: true }).fill('原始名稱')
    await page.getByTestId('create-binder-submit').filter({ visible: true }).click()
    await expect(page.getByTestId('binder-card').filter({ visible: true }).first()).toBeVisible()
    // 編輯（hover 顯示 ButtonGroup → 開啟 ⋮ 選單 → 點編輯）
    await page.getByTestId('binder-card').filter({ visible: true }).first().hover()
    await page.getByTestId('binder-more-btn').filter({ visible: true }).first().click()
    await page.getByTestId('edit-binder-btn').filter({ visible: true }).first().click()
    await page.getByTestId('binder-name-input').filter({ visible: true }).clear()
    await page.getByTestId('binder-name-input').filter({ visible: true }).fill('更新後的名稱')
    await page.getByTestId('edit-binder-submit').filter({ visible: true }).click()
    await expect(page.getByText('更新後的名稱').filter({ visible: true })).toBeVisible()
  })

  test('刪除卡冊', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    // 先從空狀態建立一本
    await page.getByText('建立第一本卡冊').filter({ visible: true }).click()
    await page.getByTestId('binder-name-input').filter({ visible: true }).fill('待刪卡冊')
    await page.getByTestId('create-binder-submit').filter({ visible: true }).click()
    await expect(page.getByTestId('binder-card').filter({ visible: true }).first()).toBeVisible()
    const initialCount = await page.getByTestId('binder-card').filter({ visible: true }).count()
    await page.getByTestId('binder-card').filter({ visible: true }).first().hover()
    await page.getByTestId('binder-more-btn').filter({ visible: true }).first().click()
    await page.getByTestId('delete-binder-btn').filter({ visible: true }).first().click()
    await page.getByTestId('confirm-delete-binder').filter({ visible: true }).click()
    await expect(page.getByTestId('binder-card').filter({ visible: true })).toHaveCount(initialCount - 1)
  })

  test('刪除卡冊後，連動扣減格位卡牌對應的 UserCard 收藏數量', async ({ page }) => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG')
    await upsertOwnedUserCard(userId, card.id, 1)
    await createBinderWithSlots(userId, 'grid_3x3', [
      { cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 },
    ])

    await page.goto('/binders')
    await expect(page.getByTestId('binder-card').filter({ visible: true }).first()).toBeVisible()
    await page.getByTestId('binder-card').filter({ visible: true }).first().hover()
    await page.getByTestId('binder-more-btn').filter({ visible: true }).first().click()
    await page.getByTestId('delete-binder-btn').filter({ visible: true }).first().click()
    await page.getByTestId('confirm-delete-binder').filter({ visible: true }).click()
    await expect(page.getByTestId('binder-card').filter({ visible: true })).toHaveCount(0)

    const remaining = await prisma.userCard.findUnique({
      where: { userId_cardId_status: { userId, cardId: card.id, status: 'owned' } },
    })
    expect(remaining).toBeNull()
  })

  test('建立 4x3 卡冊並以 4 欄 12 格顯示', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    await page.getByText('建立第一本卡冊').filter({ visible: true }).click()
    await page.getByTestId('binder-name-input').filter({ visible: true }).fill('4x3 測試冊')
    // 格式選單改為 Tabs，點擊 4×3 tab
    await page.getByTestId('binder-grid-tabs').filter({ visible: true }).getByText('4×3').click()
    await page.getByTestId('create-binder-submit').filter({ visible: true }).click()
    await expect(page.getByTestId('binder-card').filter({ visible: true }).first()).toBeVisible()
    // 卡片格式以 binder-info 呈現（'4×3' 亦為 grid Tabs 標籤，需 scope 避免 strict-mode 命中兩元素）
    await expect(page.getByTestId('binder-info').filter({ visible: true })).toContainText('4×3')
    // 進入卡冊內頁，第一頁應為 4 欄 × 12 格
    await page.getByTestId('binder-card').filter({ visible: true }).first().hover()
    await page.getByTestId('enter-binder-btn').filter({ visible: true }).first().click()
    await expect(page).toHaveURL(/\/binders\/[a-z0-9-]+/)
    const grid = page.locator('div.grid[style*="repeat(4"]').first()
    await expect(grid).toBeVisible()
    await expect(grid.locator('[data-index]')).toHaveCount(12)
  })

  test('規格選單包含 4 × 3、不包含 3 × 4', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    await page.getByText('建立第一本卡冊').filter({ visible: true }).click()
    // 格式選單改為 Tabs
    const gridTabs = page.getByTestId('binder-grid-tabs').filter({ visible: true })
    await expect(gridTabs.getByText('4×3')).toBeVisible()
    await expect(gridTabs.getByText('3×4')).toHaveCount(0)
  })

  test('點擊進入卡冊導向正確 URL', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    // 先從空狀態建立一本
    await page.getByText('建立第一本卡冊').filter({ visible: true }).click()
    await page.getByTestId('binder-name-input').filter({ visible: true }).fill('導向測試冊')
    await page.getByTestId('create-binder-submit').filter({ visible: true }).click()
    await expect(page.getByTestId('binder-card').filter({ visible: true }).first()).toBeVisible()
    await page.getByTestId('binder-card').filter({ visible: true }).first().hover()
    await page.getByTestId('enter-binder-btn').filter({ visible: true }).first().click()
    await expect(page).toHaveURL(/\/binders\/[a-z0-9-]+/)
  })

  test('header 顯示卡冊統計 N / 3 本', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    await expect(page.getByTestId('binder-count-stat').filter({ visible: true })).toContainText(/0\s*\/\s*3\s*本/)
    // 建立一本後計數更新
    await page.getByText('建立第一本卡冊').filter({ visible: true }).click()
    await page.getByTestId('binder-name-input').filter({ visible: true }).fill('計數測試冊')
    await page.getByTestId('create-binder-submit').filter({ visible: true }).click()
    await expect(page.getByTestId('binder-card').filter({ visible: true }).first()).toBeVisible()
    await expect(page.getByTestId('binder-count-stat').filter({ visible: true })).toContainText(/1\s*\/\s*3\s*本/)
  })

  test('hover 後操作按鈕顯示', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    await page.getByText('建立第一本卡冊').filter({ visible: true }).click()
    await page.getByTestId('binder-name-input').filter({ visible: true }).fill('Hover 測試冊')
    await page.getByTestId('create-binder-submit').filter({ visible: true }).click()
    await expect(page.getByTestId('binder-card').filter({ visible: true }).first()).toBeVisible()
    // hover 後按鈕的 opacity 應為 1
    await page.getByTestId('binder-card').filter({ visible: true }).first().hover()
    const enterBtn = page.getByTestId('enter-binder-btn').filter({ visible: true }).first()
    await expect(enterBtn).toHaveCSS('opacity', '1')
  })
})
