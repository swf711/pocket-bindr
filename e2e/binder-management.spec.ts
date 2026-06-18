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
    await expect(page.getByTestId('empty-binder-state')).toBeVisible()
  })

  test('建立新卡冊', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    // 無卡冊時從空狀態按鈕開啟 Dialog
    await page.getByText('建立第一本卡冊').click()
    await page.getByTestId('binder-name-input').fill('我的第一本冊')
    await page.getByTestId('binder-grid-select').click()
    await page.getByRole('option', { name: /3 × 3/ }).click()
    await page.getByTestId('create-binder-submit').click()
    await expect(page.getByTestId('binder-card')).toBeVisible()
    await expect(page.getByText('我的第一本冊')).toBeVisible()
  })

  test('編輯卡冊名稱', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    // 先從空狀態建立一本
    await page.getByText('建立第一本卡冊').click()
    await page.getByTestId('binder-name-input').fill('原始名稱')
    await page.getByTestId('create-binder-submit').click()
    await expect(page.getByTestId('binder-card')).toBeVisible()
    // 編輯（hover 後按鈕才顯示）
    await page.getByTestId('binder-card').first().hover()
    await page.getByTestId('edit-binder-btn').first().click()
    await page.getByTestId('binder-name-input').clear()
    await page.getByTestId('binder-name-input').fill('更新後的名稱')
    await page.getByTestId('edit-binder-submit').click()
    await expect(page.getByText('更新後的名稱')).toBeVisible()
  })

  test('刪除卡冊', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    // 先從空狀態建立一本
    await page.getByText('建立第一本卡冊').click()
    await page.getByTestId('binder-name-input').fill('待刪卡冊')
    await page.getByTestId('create-binder-submit').click()
    await expect(page.getByTestId('binder-card')).toBeVisible()
    const initialCount = await page.getByTestId('binder-card').count()
    await page.getByTestId('binder-card').first().hover()
    await page.getByTestId('delete-binder-btn').first().click()
    await page.getByTestId('confirm-delete-binder').click()
    await expect(page.getByTestId('binder-card')).toHaveCount(initialCount - 1)
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
    await expect(page.getByTestId('binder-card')).toBeVisible()
    await page.getByTestId('binder-card').first().hover()
    await page.getByTestId('delete-binder-btn').first().click()
    await page.getByTestId('confirm-delete-binder').click()
    await expect(page.getByTestId('binder-card')).toHaveCount(0)

    const remaining = await prisma.userCard.findUnique({
      where: { userId_cardId_status: { userId, cardId: card.id, status: 'owned' } },
    })
    expect(remaining).toBeNull()
  })

  test('建立 4x3 卡冊並以 4 欄 12 格顯示', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    await page.getByText('建立第一本卡冊').click()
    await page.getByTestId('binder-name-input').fill('4x3 測試冊')
    await page.getByTestId('binder-grid-select').click()
    await page.getByRole('option', { name: /4 × 3/ }).click()
    await page.getByTestId('create-binder-submit').click()
    await expect(page.getByTestId('binder-card')).toBeVisible()
    await expect(page.getByText('4×3')).toBeVisible()
    // 進入卡冊內頁，第一頁應為 4 欄 × 12 格
    await page.getByTestId('binder-card').first().hover()
    await page.getByTestId('enter-binder-btn').first().click()
    await expect(page).toHaveURL(/\/binders\/[a-z0-9-]+/)
    const grid = page.locator('div.grid[style*="repeat(4"]').first()
    await expect(grid).toBeVisible()
    await expect(grid.locator('[data-index]')).toHaveCount(12)
  })

  test('規格選單包含 4 × 3、不包含 3 × 4', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    await page.getByText('建立第一本卡冊').click()
    await page.getByTestId('binder-grid-select').click()
    await expect(page.getByRole('option', { name: /4 × 3/ })).toBeVisible()
    await expect(page.getByRole('option', { name: /3 × 4/ })).toHaveCount(0)
  })

  test('點擊進入卡冊導向正確 URL', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    // 先從空狀態建立一本
    await page.getByText('建立第一本卡冊').click()
    await page.getByTestId('binder-name-input').fill('導向測試冊')
    await page.getByTestId('create-binder-submit').click()
    await expect(page.getByTestId('binder-card')).toBeVisible()
    await page.getByTestId('binder-card').first().hover()
    await page.getByTestId('enter-binder-btn').first().click()
    await expect(page).toHaveURL(/\/binders\/[a-z0-9-]+/)
  })

  test('header 顯示卡冊統計 N / 3 本', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    await expect(page.getByText(/0\s*\/\s*3\s*本/)).toBeVisible()
    // 建立一本後計數更新
    await page.getByText('建立第一本卡冊').click()
    await page.getByTestId('binder-name-input').fill('計數測試冊')
    await page.getByTestId('create-binder-submit').click()
    await expect(page.getByTestId('binder-card')).toBeVisible()
    await expect(page.getByText(/1\s*\/\s*3\s*本/)).toBeVisible()
  })

  test('hover 後操作按鈕顯示', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    await page.getByText('建立第一本卡冊').click()
    await page.getByTestId('binder-name-input').fill('Hover 測試冊')
    await page.getByTestId('create-binder-submit').click()
    await expect(page.getByTestId('binder-card')).toBeVisible()
    // hover 後按鈕的 opacity 應為 1
    await page.getByTestId('binder-card').first().hover()
    const enterBtn = page.getByTestId('enter-binder-btn').first()
    await expect(enterBtn).toHaveCSS('opacity', '1')
  })
})
