import { test, expect } from './helpers/test'

/**
 * 切換遊戲／語言／系列時過渡為 skeleton，而非沿用舊資料到新資料抵達那一刻才突然替換
 * （親測回饋：原本因 `keepPreviousData` 悄悄沿用舊列表，畫面「停住幾秒才突然換一批卡」）。
 * 換頁刻意維持既有無縫行為（不顯示 skeleton），故另測一組換頁不觸發 skeleton 的迴歸案例。
 */
test.describe('卡牌搜尋頁 — 篩選切換 skeleton', () => {
  test('切換遊戲時顯示 skeleton，新結果抵達後消失', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    // 延遲切換後的 /api/cards 回應，確保 skeleton 有時間被觀察到
    await page.route('**/api/cards?**', async (route) => {
      await new Promise((r) => setTimeout(r, 800))
      await route.continue()
    })

    await page.getByTestId('game-btn-opcg').click()
    await expect(page.getByTestId('card-grid-loading')).toBeVisible()
    await expect(page.getByTestId('card-grid-loading')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('card-grid')).toBeVisible()

    await page.unrouteAll({ behavior: 'ignoreErrors' })
  })

  test('換頁不觸發 skeleton（維持既有無縫換頁手感）', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.route('**/api/cards?**', async (route) => {
      await new Promise((r) => setTimeout(r, 800))
      await route.continue()
    })

    const nextBtn = page.getByTestId('page-next')
    if (await nextBtn.isVisible()) {
      await nextBtn.click()
      // 給予與上一測試相同的延遲窗口，斷言 skeleton 全程未出現
      await page.waitForTimeout(400)
      await expect(page.getByTestId('card-grid-loading')).not.toBeVisible()
      await expect(page.getByTestId('card-grid')).toBeVisible()
    }

    await page.unrouteAll({ behavior: 'ignoreErrors' })
  })
})
