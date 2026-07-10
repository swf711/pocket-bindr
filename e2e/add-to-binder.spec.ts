// Requires running server and test database
import { test, expect, Page } from '@playwright/test'
import { getTestUser, loginAs } from './helpers/auth'
import {
  clearUserBindersByEmail,
  clearUserCardsByEmail,
  getCardWithImage,
  getUserIdByEmail,
  upsertOwnedUserCard,
} from './helpers/db'

async function signOut(page: Page): Promise<void> {
  await page.goto('/api/auth/signout')
  await page.waitForLoadState('networkidle')
  const csrfButton = page.getByRole('button', { name: /sign out/i })
  if (await csrfButton.isVisible()) {
    await csrfButton.click()
    await page.waitForLoadState('networkidle')
  }
}

const USER = getTestUser('addtobinder')

test.describe('加入卡冊功能', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)

    // Create a test binder via API
    const res = await page.request.post('/api/binders', {
      data: { name: 'E2E Test Binder', gridType: 'grid_3x3' },
    })
    expect(res.status()).toBe(201)
  })

  test.afterAll(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
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
    await expect(page.getByTestId('modal-qty-value')).toHaveValue('1')
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

test.describe('加入卡冊 - 記住當頁上次加入的卡冊', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)

    const resA = await page.request.post('/api/binders', {
      data: { name: 'E2E Binder A', gridType: 'grid_3x3' },
    })
    expect(resA.status()).toBe(201)
    const resB = await page.request.post('/api/binders', {
      data: { name: 'E2E Binder B', gridType: 'grid_3x3' },
    })
    expect(resB.status()).toBe(201)
  })

  test.afterAll(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
  })

  test('同頁再開另一張卡的 Drawer，卡冊下拉預選上次加入的卡冊；重整頁面後恢復預設', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    // 首次開啟：無記憶，預選第一本（Binder A）
    await page.getByTestId('card-item').nth(0).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByTestId('modal-binder-select')).toContainText('E2E Binder A', { timeout: 8000 })

    // 選 Binder B 並加入
    await page.getByTestId('modal-binder-select').click()
    await page.getByRole('option', { name: 'E2E Binder B' }).click()
    await page.getByTestId('modal-add-btn').click()
    await expect(page.getByText(/已加入/)).toBeVisible({ timeout: 5000 })

    // 關閉 Drawer，開另一張卡
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await page.getByTestId('card-item').nth(1).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // 預選記住上次加入的 Binder B
    await expect(page.getByTestId('modal-binder-select')).toContainText('E2E Binder B', { timeout: 8000 })
    await page.keyboard.press('Escape')

    // 硬重整後記憶歸零，恢復預選第一本
    await page.reload()
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('card-item').nth(0).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByTestId('modal-binder-select')).toContainText('E2E Binder A', { timeout: 8000 })
  })
})

test.describe('加入卡冊 - 無卡冊情境', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    // Intentionally do NOT create a binder
  })

  test.afterAll(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
  })

  test('已登入無卡冊：原地建立卡冊後可直接加入', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('card-item').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // 顯示「建立卡冊」按鈕而非導頁連結
    const createBtn = page.getByRole('button', { name: '建立卡冊' })
    await expect(createBtn).toBeVisible({ timeout: 8000 })
    await createBtn.click()

    // 原地彈出 CreateBinderDialog，不導離 /cards
    await page.getByTestId('binder-name-input').fill('E2E Inline Binder')
    await page.getByTestId('create-binder-submit').click()
    await expect(page).toHaveURL(/\/cards/)

    // 建立成功後直接顯示卡冊選擇 UI，可繼續加入
    await expect(page.getByTestId('modal-binder-select')).toBeVisible({ timeout: 8000 })
    await page.getByTestId('modal-add-btn').click()
    await expect(page.getByText(/已加入/)).toBeVisible({ timeout: 5000 })
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

  test('訪客登入後，不重新整理頁面即可看到已存在的收藏狀態', async ({ page }) => {
    // 確保帳號存在並記下已登入前的收藏狀態
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG')
    await upsertOwnedUserCard(userId, card.id, 2)
    await signOut(page)

    // 以訪客身分搜尋同一張卡（同名卡牌可能有多張，需以圖片網址鎖定唯一一張）
    await page.goto(`/cards?game=PTCG&language=${card.language}`)
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('search-input').fill(card.name)
    const targetCardItem = page.getByTestId('card-item').filter({ has: page.locator(`img[src*="${encodeURIComponent(card.imageSmall)}"]`) })
    await expect(targetCardItem).toHaveCount(1, { timeout: 8000 })
    await targetCardItem.click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // 訪客視角一律顯示 0（不洩漏未登入前的真實收藏狀態）
    await expect(page.getByTestId('modal-owned-count')).toHaveText('0')

    // 點擊加入卡冊 → 登入 modal → 登入成功
    await page.getByTestId('modal-add-btn').click()
    await expect(page.getByTestId('login-modal')).toBeVisible({ timeout: 5000 })
    await page.getByLabel('Email').fill(USER.email)
    await page.getByLabel('密碼', { exact: true }).fill(USER.password)
    await page.getByRole('button', { name: '登入', exact: true }).click()

    // 不重新整理頁面，直接顯示登入前已存在的真實收藏數量
    await expect(page.getByTestId('modal-owned-count')).toHaveText('2', { timeout: 8000 })
    expect(page.url()).toContain('/cards')
  })
})
