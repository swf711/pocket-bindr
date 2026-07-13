import { test, expect } from './helpers/test'

/**
 * 搜尋教學引導 E2E：
 *  1. 搜尋框 placeholder 例句隨 game/language 動態變化
 *  2. `?` 圖例 popover（桌面）/ drawer（行動裝置）開合
 *  3. 照抄例句可精準命中
 */

test.describe('搜尋框 placeholder 例句', () => {
  test('選 PTCG 後 placeholder 含例句，切語言/遊戲會更新', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    const input = page.getByTestId('search-input')
    await expect(input).toHaveAttribute('placeholder', /MJF 008\/022/)

    await page.getByTestId('language-tab-en').click()
    await expect(page).toHaveURL(/language=EN/, { timeout: 10000 })
    await expect(input).toHaveAttribute('placeholder', /me2pt5 55/)

    await page.getByTestId('game-btn-opcg').click()
    await expect(page.getByTestId('card-grid').or(page.getByText('沒有找到卡牌'))).toBeVisible({
      timeout: 10000,
    })
    await expect(input).toHaveAttribute('placeholder', /OP16-015/)
  })
})

test.describe('搜尋說明 popover', () => {
  test('桌面：點 ? 開啟圖例 popover，含卡圖標註', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('search-help-trigger').click()
    const content = page.getByTestId('search-help-content')
    await expect(content).toBeVisible()
    await expect(content.locator('img')).toBeVisible()
  })

  test('行動裝置：底部 Drawer 呈現圖例', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('search-help-trigger').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByTestId('search-help-content')).toBeVisible()
  })
})

test.describe('例句命中驗證', () => {
  test('照抄例句貼進搜尋框可精準命中', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('search-input').fill('MJF 008/022')
    await expect(page).toHaveURL(/q=/, { timeout: 10000 })
    await expect(page.getByTestId('result-total')).toContainText(/搜尋結果 1 張/, { timeout: 10000 })
  })
})
