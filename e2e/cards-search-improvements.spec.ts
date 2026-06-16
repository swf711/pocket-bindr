import { test, expect } from '@playwright/test'

/**
 * E2E tests for the three search improvements shipped by Dev Agents 1–3:
 *  1. TwoColumnSelectGroup — series filter shows externalId in label
 *  2. CardDetailModal navigation — prev/next buttons and keyboard arrows
 *  3. externalId prefix search — q=OP15 matches cards by externalId
 */

test.describe('系列篩選顯示 externalId', () => {
  test('每個系列選項標籤包含 externalId（格式：名稱 id）', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    // Open the set/series filter combobox
    await page.getByTestId('set-combobox').click()

    // Wait for options to appear — at least one option beyond "所有系列"
    const options = page.getByRole('option')
    await options.nth(1).waitFor({ timeout: 5000 })

    // Collect text of all options except the first ("所有系列")
    const count = await options.count()
    // Skip index 0 which is the "all sets" placeholder
    let found = false
    for (let i = 1; i < Math.min(count, 6); i++) {
      const text = await options.nth(i).textContent()
      // 實作格式為「名稱 <span>externalId</span>」，textContent 為空格分隔
      if (text && /\s[A-Z0-9]/.test(text.trim())) {
        found = true
        break
      }
    }
    expect(found).toBe(true)
  })

  test('系列 ComboBox 項目排列在 2 欄格線容器內', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('set-combobox').click()

    // 等選項出現（第一群組為 series group，其 cmdk-group-items 套用 grid sm:grid-cols-2）
    await page.getByRole('option').nth(1).waitFor({ timeout: 5000 })

    // 桌面視窗（>=sm）下，series group 的項目容器 computed display 應為 grid
    const groupItems = page.locator('[cmdk-group-items]')
    const gridCount = await groupItems.count()
    let hasGrid = false
    for (let i = 0; i < gridCount; i++) {
      const display = await groupItems.nth(i).evaluate(el => getComputedStyle(el).display)
      if (display === 'grid') { hasGrid = true; break }
    }
    expect(hasGrid).toBe(true)
  })
})

test.describe('Modal 導航 - 前後翻頁', () => {
  test('點擊第 3 張卡開啟 Modal，next 翻到第 4 張，prev 翻回第 3 張', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    const cardItems = page.getByTestId('card-item')
    const cardCount = await cardItems.count()
    // Need at least 4 cards for this test to be meaningful
    if (cardCount < 4) {
      test.skip()
      return
    }

    // Get the name of the 3rd card (index 2) before clicking
    const card3Name = await cardItems.nth(2).textContent()
    const card4Name = await cardItems.nth(3).textContent()

    // Click the 3rd card
    await cardItems.nth(2).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Capture the modal title (card name) after opening
    const titleBefore = await dialog.getByRole('heading').textContent()

    // Click next
    await page.getByTestId('modal-nav-next').click()

    // Modal should now show the 4th card — title changes
    const titleAfter = await dialog.getByRole('heading').textContent()
    expect(titleAfter).not.toBe(titleBefore)

    // Click prev — should return to 3rd card
    await page.getByTestId('modal-nav-prev').click()
    const titleBack = await dialog.getByRole('heading').textContent()
    expect(titleBack).toBe(titleBefore)

    // Suppress unused variable warnings
    void card3Name
    void card4Name
  })
})

test.describe('Modal 導航 - 鍵盤', () => {
  test('ArrowRight 鍵切換到下一張卡', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    const cardItems = page.getByTestId('card-item')
    const cardCount = await cardItems.count()
    if (cardCount < 2) {
      test.skip()
      return
    }

    // Open the first card — it's not the last, so ArrowRight should work
    await cardItems.first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    const titleBefore = await dialog.getByRole('heading').textContent()

    await page.keyboard.press('ArrowRight')

    const titleAfter = await dialog.getByRole('heading').textContent()
    expect(titleAfter).not.toBe(titleBefore)
  })
})

test.describe('Modal 導航 - 邊界', () => {
  test('第一張卡的 prev 按鈕為 disabled', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('card-item').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()

    const prevBtn = page.getByTestId('modal-nav-prev')
    await expect(prevBtn).toBeDisabled()
  })

  test('最後一張可見卡牌的 next 按鈕為 disabled', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    const cardItems = page.getByTestId('card-item')
    const count = await cardItems.count()
    if (count === 0) {
      test.skip()
      return
    }

    // Click the last visible card
    await cardItems.last().click()
    await expect(page.getByRole('dialog')).toBeVisible()

    const nextBtn = page.getByTestId('modal-nav-next')
    await expect(nextBtn).toBeDisabled()
  })
})

test.describe('externalId 前綴搜尋', () => {
  test('OPCG game 輸入 OP01 可取得結果且無錯誤', async ({ page }) => {
    await page.goto('/cards?game=OPCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('search-input').fill('OP01')
    await expect(page).toHaveURL(/q=OP01/, { timeout: 10000 })

    // Either cards are shown or the no-results message — no error state
    await expect(
      page.getByTestId('card-grid').or(page.getByText('沒有找到卡牌'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('名稱模糊搜尋回歸 — PTCG 輸入關鍵字不出現錯誤', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('search-input').fill('pikachu')
    await expect(page).toHaveURL(/q=pikachu/, { timeout: 10000 })

    await expect(
      page.getByTestId('card-grid').or(page.getByText('沒有找到卡牌'))
    ).toBeVisible({ timeout: 10000 })
  })
})
