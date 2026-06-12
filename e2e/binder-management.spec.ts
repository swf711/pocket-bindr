import { test, expect } from '@playwright/test'
import { getTestUser, loginAs } from './helpers/auth'
import { clearUserBindersByEmail } from './helpers/db'

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
    await page.getByTestId('create-binder-btn').click()
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
    // 先建立一本
    await page.getByTestId('create-binder-btn').click()
    await page.getByTestId('binder-name-input').fill('原始名稱')
    await page.getByTestId('create-binder-submit').click()
    await expect(page.getByTestId('binder-card')).toBeVisible()
    // 編輯
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
    // 先建立一本
    await page.getByTestId('create-binder-btn').click()
    await page.getByTestId('binder-name-input').fill('待刪卡冊')
    await page.getByTestId('create-binder-submit').click()
    await expect(page.getByTestId('binder-card')).toBeVisible()
    const initialCount = await page.getByTestId('binder-card').count()
    await page.getByTestId('delete-binder-btn').first().click()
    await page.getByTestId('confirm-delete-binder').click()
    await expect(page.getByTestId('binder-card')).toHaveCount(initialCount - 1)
  })

  test('建立 4x3 卡冊並以 4 欄 12 格顯示', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    await page.getByTestId('create-binder-btn').click()
    await page.getByTestId('binder-name-input').fill('4x3 測試冊')
    await page.getByTestId('binder-grid-select').click()
    await page.getByRole('option', { name: /4 × 3/ }).click()
    await page.getByTestId('create-binder-submit').click()
    await expect(page.getByTestId('binder-card')).toBeVisible()
    await expect(page.getByText('4×3')).toBeVisible()
    // 進入卡冊內頁，第一頁應為 4 欄 × 12 格
    await page.getByTestId('enter-binder-btn').first().click()
    await expect(page).toHaveURL(/\/binders\/[a-z0-9-]+/)
    const grid = page.locator('div.grid[style*="repeat(4"]').first()
    await expect(grid).toBeVisible()
    await expect(grid.locator('[data-index]')).toHaveCount(12)
  })

  test('規格選單包含 4 × 3、不包含 3 × 4', async ({ page }) => {
    await loginAs(page, USER)
    await page.goto('/binders')
    await page.getByTestId('create-binder-btn').click()
    await page.getByTestId('binder-grid-select').click()
    await expect(page.getByRole('option', { name: /4 × 3/ })).toBeVisible()
    await expect(page.getByRole('option', { name: /3 × 4/ })).toHaveCount(0)
  })

  test('點擊進入卡冊導向正確 URL', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    // 先建立一本
    await page.getByTestId('create-binder-btn').click()
    await page.getByTestId('binder-name-input').fill('導向測試冊')
    await page.getByTestId('create-binder-submit').click()
    await expect(page.getByTestId('binder-card')).toBeVisible()
    await page.getByTestId('enter-binder-btn').first().click()
    await expect(page).toHaveURL(/\/binders\/[a-z0-9-]+/)
  })
})
