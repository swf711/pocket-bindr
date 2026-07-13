import { test, expect } from './helpers/test'

/**
 * 卡牌搜尋頁 UI 改版 E2E：
 *  1. 未選遊戲 → 大按鈕；選後 → Tabs，語言 Tabs 同列
 *  2. 語言 Tabs 切換更新結果
 *  3. 關鍵字 search icon addon
 *  4. 系列 ComboBox 可搜尋過濾、兩欄分組、選擇更新 URL
 *  5. grid 上下雙 pagination
 *  6. 顯示「搜尋結果 N 張」
 *  7. 點卡牌開右側 Drawer + 上一張/下一張
 */

test.describe('GameSelector 大按鈕 ↔ Tabs', () => {
  test('未選遊戲顯示大按鈕，點 PTCG 後變 Tabs 且語言 Tabs 同時出現', async ({ page }) => {
    await page.goto('/cards')

    // 未選遊戲：尚無卡牌 grid，但有遊戲選擇器（大按鈕）
    await expect(page.getByTestId('game-selector')).toBeVisible()
    await expect(page.getByTestId('card-grid')).not.toBeVisible()
    // 尚未選遊戲時語言 Tabs 不顯示
    await expect(page.getByTestId('language-tabs')).not.toBeVisible()

    await page.getByTestId('game-btn-ptcg').click()
    await expect(page.getByTestId('card-grid')).toBeVisible({ timeout: 10000 })

    // 選定後：GameSelector 變 Tabs（tab role），語言 Tabs 出現
    await expect(page.getByTestId('language-tabs')).toBeVisible()
    await expect(page.getByTestId('game-btn-ptcg')).toHaveAttribute('data-state', 'active')
  })
})

test.describe('語言 Tabs', () => {
  test('切換英文更新 URL 與結果', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('language-tab-en').click()
    await expect(page).toHaveURL(/language=EN/, { timeout: 10000 })
    await expect(page.getByTestId('language-tab-en')).toHaveAttribute('data-state', 'active')
    await expect(
      page.getByTestId('card-grid').or(page.getByText('沒有找到卡牌'))
    ).toBeVisible({ timeout: 10000 })
  })
})

test.describe('關鍵字 search addon', () => {
  test('搜尋框含 search icon 且輸入更新 q', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    // InputGroup addon 內含 svg icon
    const addonIcon = page.locator('[data-slot="input-group-addon"] svg')
    await expect(addonIcon.first()).toBeVisible()

    await page.getByTestId('search-input').fill('pikachu')
    await expect(page).toHaveURL(/q=pikachu/, { timeout: 10000 })
  })
})

test.describe('系列 ComboBox', () => {
  test('可輸入過濾並選擇系列，更新 setId', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('set-combobox').click()
    // CommandInput 過濾
    await page.getByPlaceholder('搜尋系列...').fill('火箭')

    const option = page.getByRole('option').first()
    await option.waitFor({ timeout: 5000 })
    await option.click()

    await expect(page).toHaveURL(/setId=/, { timeout: 10000 })
  })

  test('行動裝置：以底部 Drawer 呈現，搜尋框可見且可過濾', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('set-combobox').click()
    await expect(page.getByRole('dialog')).toBeVisible()

    const searchInput = page.getByPlaceholder('搜尋系列...')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('火箭')

    const option = page.getByRole('option').first()
    await option.waitFor({ timeout: 5000 })
    await option.click()

    await expect(page).toHaveURL(/setId=/, { timeout: 10000 })
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})

test.describe('結果統計與雙 pagination', () => {
  test('顯示搜尋結果張數', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await expect(page.getByTestId('result-total')).toContainText(/搜尋結果 \d+ 張/)
  })

  test('grid 上方有 pagination（若有多頁）', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    const topPager = page.getByTestId('card-pagination-top')
    // 多頁時上方 pagination 可見；單頁時不渲染（皆為合法狀態）
    if (await topPager.count()) {
      await expect(topPager.first()).toBeVisible()
    }
  })
})

test.describe('卡牌詳情 Drawer — 資訊欄位', () => {
  test('Drawer 顯示系列(含 externalId)、發售日；不顯示類型/世代', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('card-item').first().click()
    const drawer = page.getByTestId('card-detail-drawer')
    await expect(drawer).toBeVisible()

    // 系列欄位存在
    await expect(drawer.getByText('系列')).toBeVisible()

    // 類型 / 世代 已移除
    await expect(drawer.getByText('類型')).toHaveCount(0)
    await expect(drawer.getByText('世代')).toHaveCount(0)

    // 發售日（PTCG EN 有 releaseDate，應顯示 YYYY-MM-DD 格式）
    await expect(drawer.getByText('發售日')).toBeVisible()
    await expect(drawer.getByText(/^\d{4}-\d{2}-\d{2}$/)).toBeVisible()
  })
})

test.describe('卡牌詳情 Drawer', () => {
  test('點卡牌開 Drawer，上一張/下一張可切換', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    const cardItems = page.getByTestId('card-item')
    if (await cardItems.count() < 2) {
      test.skip()
      return
    }

    await cardItems.first().click()
    const drawer = page.getByTestId('card-detail-drawer')
    await expect(drawer).toBeVisible()
    await expect(page.getByTestId('card-detail-image')).toBeVisible()

    const titleBefore = await drawer.getByRole('heading').textContent()
    await page.getByTestId('modal-nav-next').click()
    const titleAfter = await drawer.getByRole('heading').textContent()
    expect(titleAfter).not.toBe(titleBefore)
  })

  test('行動裝置：底部 Drawer，卡圖在 overlay（不在 drawer content 內）', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('card-item').first().click()
    await expect(page.getByTestId('card-detail-drawer')).toBeVisible()

    // 卡圖可見，但不應是 drawer content 的後代（在 overlay 區）
    await expect(page.getByTestId('card-detail-image')).toBeVisible()
    await expect(
      page.getByTestId('card-detail-drawer').getByTestId('card-detail-image')
    ).toHaveCount(0)
    // 行動版：上一張/下一張改放在 DrawerHeader（drawer content 內）
    await expect(
      page.getByTestId('card-detail-drawer').getByTestId('modal-nav-next')
    ).toBeVisible()
  })
})
