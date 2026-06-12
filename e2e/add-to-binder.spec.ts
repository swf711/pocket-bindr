// Requires running server and test database
import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers/auth'
import { clearTestUserBinders, clearTestUserCards } from './helpers/db'

test.describe('加入卡冊功能', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestUserCards()
    await clearTestUserBinders()
    await loginAsTestUser(page)

    // Create a test binder via API
    const res = await page.request.post('/api/binders', {
      data: { name: 'E2E Test Binder', gridType: 'grid_3x3' },
    })
    expect(res.status()).toBe(201)
  })

  test.afterAll(async () => {
    await clearTestUserCards()
    await clearTestUserBinders()
  })

  test('已登入有卡冊：加入後 Modal 數字即時更新，顯示 toast', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    // Open card detail modal
    await page.getByTestId('card-item').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Get initial owned count
    const ownedCountEl = page.getByTestId('modal-owned-count')
    await expect(ownedCountEl).toBeVisible({ timeout: 8000 })
    const initialText = await ownedCountEl.textContent()
    const initialCount = parseInt(initialText ?? '0', 10)

    // Select binder, set status=owned, qty=1, click add button
    // Radix Select 為 button，需 click trigger 再 click option（非原生 select）
    await page.getByTestId('modal-binder-select').click()
    await page.getByRole('option').first().click()
    // Status should default to owned; ensure it's selected
    const ownedToggle = page.getByTestId('modal-status-owned')
    if (await ownedToggle.isVisible()) {
      await ownedToggle.click()
    }
    await expect(page.getByTestId('modal-qty-value')).toHaveText('1')
    await page.getByTestId('modal-add-btn').click()

    // Assert owned count incremented
    await expect(ownedCountEl).toHaveText(String(initialCount + 1), { timeout: 8000 })

    // Assert sonner toast with "已加入"
    await expect(page.getByText(/已加入/)).toBeVisible({ timeout: 5000 })
  })

  test('累加：加入兩次後 ownedCount 正確增加', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('card-item').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()

    const ownedCountEl = page.getByTestId('modal-owned-count')
    await expect(ownedCountEl).toBeVisible({ timeout: 8000 })
    const initialText = await ownedCountEl.textContent()
    const initialCount = parseInt(initialText ?? '0', 10)

    // Select binder（Radix Select：click trigger 再 click option）
    await page.getByTestId('modal-binder-select').click()
    await page.getByRole('option').first().click()

    // Add owned 1, first time
    const ownedToggle = page.getByTestId('modal-status-owned')
    if (await ownedToggle.isVisible()) {
      await ownedToggle.click()
    }
    await page.getByTestId('modal-add-btn').click()
    await expect(ownedCountEl).toHaveText(String(initialCount + 1), { timeout: 8000 })

    // Add owned 1, second time
    if (await ownedToggle.isVisible()) {
      await ownedToggle.click()
    }
    await page.getByTestId('modal-add-btn').click()
    await expect(ownedCountEl).toHaveText(String(initialCount + 2), { timeout: 8000 })
  })
})

test.describe('加入卡冊 - 無卡冊情境', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestUserCards()
    await clearTestUserBinders()
    await loginAsTestUser(page)
    // Intentionally do NOT create a binder
  })

  test.afterAll(async () => {
    await clearTestUserCards()
    await clearTestUserBinders()
  })

  test('已登入無卡冊：顯示建立連結', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('card-item').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Should show a link to /binders to create one
    await expect(page.getByText(/前往建立/)).toBeVisible({ timeout: 8000 })
  })
})

test.describe('加入卡冊 - 未登入情境', () => {
  test('未登入：點擊加入卡冊彈出登入 modal', async ({ page }) => {
    // Do not login
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('card-item').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Click the add to binder button (guest state)
    await page.getByTestId('modal-add-btn').click()

    // Login modal should appear
    await expect(page.getByTestId('login-modal')).toBeVisible({ timeout: 5000 })
  })
})
