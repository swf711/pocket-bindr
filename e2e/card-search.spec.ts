import { test, expect } from '@playwright/test'

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
