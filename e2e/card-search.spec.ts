import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers/auth'

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
    await page.waitForTimeout(500)
    expect(page.url()).toContain('q=pikachu')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
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

  test('未登入點擊收藏顯示登入 modal', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('btn-owned').first().click()
    await expect(page.getByTestId('login-modal')).toBeVisible()
  })
})

test.describe('Scenario 7 & 8: 登入使用者收藏操作', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('Scenario 7: 登入使用者標記 owned 立即更新 UI', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    const firstOwnedBtn = page.getByTestId('btn-owned').first()
    await firstOwnedBtn.click()
    await expect(page.getByTestId('login-modal')).not.toBeVisible()
    await expect(firstOwnedBtn).toHaveClass(/bg-green-500/)
  })

  test('Scenario 8: 切換標記（owned → wanted）與取消', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    const firstCard = page.getByTestId('card-item').first()
    const ownedBtn = firstCard.getByTestId('btn-owned')
    const wantedBtn = firstCard.getByTestId('btn-wanted')

    // 標記 owned
    await ownedBtn.click()
    await expect(ownedBtn).toHaveClass(/bg-green-500/)

    // 切換至 wanted
    await wantedBtn.click()
    await expect(wantedBtn).toHaveClass(/bg-pink-500/)
    await expect(ownedBtn).not.toHaveClass(/bg-green-500/)

    // 取消 wanted
    await wantedBtn.click()
    await expect(wantedBtn).not.toHaveClass(/bg-pink-500/)
  })
})
