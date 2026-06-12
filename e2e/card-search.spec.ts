import { test, expect } from '@playwright/test'
import { getTestUser, loginAs } from './helpers/auth'
import { clearUserCardsByEmail, clearUserBindersByEmail } from './helpers/db'

const USER = getTestUser('cardsearch')

test.describe('卡片搜尋頁', () => {
  test('未選遊戲時不顯示卡牌', async ({ page }) => {
    await page.goto('/cards')
    await expect(page.getByTestId('card-grid')).not.toBeVisible()
    await expect(page.getByTestId('game-selector')).toBeVisible()
  })

  test('選擇 PTCG 後顯示卡牌和篩選器', async ({ page }) => {
    await page.goto('/cards')
    await page.getByTestId('game-btn-ptcg').click()
    await expect(page.getByTestId('card-grid')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('set-filter')).toBeVisible()
    expect(page.url()).toContain('game=PTCG')
  })

  test('關鍵字搜尋更新 URL 和結果', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('search-input').fill('pikachu')
    await expect(page).toHaveURL(/q=pikachu/, { timeout: 10000 })
    // 等待搜尋完成：cards 顯示或顯示「沒有找到卡牌」
    await expect(
      page.getByTestId('card-grid').or(page.getByText('沒有找到卡牌'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('分頁切換更新 URL', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    const nextBtn = page.getByTestId('page-next')
    if (await nextBtn.isVisible()) {
      await nextBtn.click()
      await page.waitForTimeout(500)
      expect(page.url()).toContain('page=2')
    }
  })

  test('點擊卡牌開啟 Modal', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('card-item').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByTestId('modal-owned-count')).toBeVisible()
  })

  test('Modal 顯示卡牌資訊', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('card-item').first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('img')).toBeVisible()
    await expect(dialog.getByTestId('modal-owned-count')).toBeVisible()
    await expect(dialog.getByTestId('modal-wanted-count')).toBeVisible()
  })
})

test.describe('登入使用者 Modal 操作', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
  })

  test.afterAll(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
  })

  test('Modal 無卡冊時顯示引導文字', async ({ page }) => {
    // TODO: 此測試依賴 GET /api/binders 實作（目前為 stub，回傳 405）。
    // /api/binders 完成後移除 skip，確認 「尚無卡冊」 文字顯示。
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('card-item').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/尚無卡冊/)).toBeVisible({ timeout: 8000 })
  })

  test('Modal 數量加減功能', async ({ page }) => {
    // 數量控制僅在有卡冊時渲染（noBinders 為引導文字 early return），需先建立卡冊
    const res = await page.request.post('/api/binders', {
      data: { name: 'E2E Qty Binder', gridType: 'grid_3x3' },
    })
    expect(res.status()).toBe(201)

    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('card-item').first().click()
    // 等 modal 出現
    await expect(page.getByRole('dialog')).toBeVisible()
    // 等 binders fetch 完成（binder select 出現）再操作，避免 re-render 造成 element detached
    await expect(page.getByTestId('modal-binder-select')).toBeVisible({ timeout: 8000 })
    const qtyValue = page.getByTestId('modal-qty-value')
    await expect(qtyValue).toHaveText('1')
    await page.getByTestId('modal-qty-plus').click()
    await expect(qtyValue).toHaveText('2')
    await page.getByTestId('modal-qty-minus').click()
    await expect(qtyValue).toHaveText('1')
    // 不能低於 1
    await page.getByTestId('modal-qty-minus').click()
    await expect(qtyValue).toHaveText('1')
  })
})
