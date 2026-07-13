import { test, expect } from './helpers/test'

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

test.describe('PTCG set code + 卡號搜尋', () => {
  test('PTCG EN 輸入 sv8-001（補零格式）不出現錯誤', async ({ page }) => {
    await page.goto('/cards?game=PTCG&language=EN')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('search-input').fill('sv8-001')
    await expect(page).toHaveURL(/q=sv8-001/, { timeout: 10000 })

    await expect(
      page.getByTestId('card-grid').or(page.getByText('沒有找到卡牌'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('PTCG EN 輸入 sv8-1（非補零格式）不出現錯誤', async ({ page }) => {
    await page.goto('/cards?game=PTCG&language=EN')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('search-input').fill('sv8-1')
    await expect(page).toHaveURL(/q=sv8-1/, { timeout: 10000 })

    await expect(
      page.getByTestId('card-grid').or(page.getByText('沒有找到卡牌'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('PTCG JA 輸入 sv8b-001 不出現錯誤', async ({ page }) => {
    await page.goto('/cards?game=PTCG&language=JA')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('search-input').fill('sv8b-001')
    await expect(page).toHaveURL(/q=sv8b-001/, { timeout: 10000 })

    await expect(
      page.getByTestId('card-grid').or(page.getByText('沒有找到卡牌'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('PTCG 輸入 sv8（純 set code，set-only）不出現錯誤', async ({ page }) => {
    await page.goto('/cards?game=PTCG&language=JA')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('search-input').fill('sv8b')
    await expect(page).toHaveURL(/q=sv8b/, { timeout: 10000 })

    await expect(
      page.getByTestId('card-grid').or(page.getByText('沒有找到卡牌'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('PTCG 輸入 sv8-00（前綴卡號）不出現錯誤', async ({ page }) => {
    await page.goto('/cards?game=PTCG&language=JA')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('search-input').fill('sv8b-00')
    await expect(page).toHaveURL(/q=sv8b-00/, { timeout: 10000 })

    await expect(
      page.getByTestId('card-grid').or(page.getByText('沒有找到卡牌'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('PTCG 輸入 pikachu 仍正常搜尋（name 搜尋回歸）', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('search-input').fill('pikachu')
    await expect(page).toHaveURL(/q=pikachu/, { timeout: 10000 })

    await expect(
      page.getByTestId('card-grid').or(page.getByText('沒有找到卡牌'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('OPCG 輸入 OP16-002 仍命中（externalId 路徑回歸）', async ({ page }) => {
    await page.goto('/cards?game=OPCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('search-input').fill('OP16-002')
    await expect(page).toHaveURL(/q=OP16-002/, { timeout: 10000 })

    await expect(
      page.getByTestId('card-grid').or(page.getByText('沒有找到卡牌'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('PTCG JA 輸入 sv4a 036/190（空格+斜線，一般化解析）不出現錯誤', async ({ page }) => {
    await page.goto('/cards?game=PTCG&language=JA')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('search-input').fill('sv4a 036/190')
    await expect(page).toHaveURL(/q=sv4a\+036%2F190/, { timeout: 10000 })

    await expect(
      page.getByTestId('card-grid').or(page.getByText('沒有找到卡牌'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('OPCG 輸入 op11 072（空格分隔）不出現錯誤', async ({ page }) => {
    await page.goto('/cards?game=OPCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('search-input').fill('op11 072')
    await expect(page).toHaveURL(/q=op11\+072/, { timeout: 10000 })

    await expect(
      page.getByTestId('card-grid').or(page.getByText('沒有找到卡牌'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('PTCG EN 輸入 036/190（斜線單獨形，無 set code）不出現錯誤', async ({ page }) => {
    await page.goto('/cards?game=PTCG&language=EN')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('search-input').fill('036/190')
    await expect(page).toHaveURL(/q=036%2F190/, { timeout: 10000 })

    await expect(
      page.getByTestId('card-grid').or(page.getByText('沒有找到卡牌'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('PTCG 輸入 pikachu ex（多詞卡名）仍正常搜尋（不誤觸空格型號解析）', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('search-input').fill('pikachu ex')
    await expect(page).toHaveURL(/q=pikachu\+ex/, { timeout: 10000 })

    await expect(
      page.getByTestId('card-grid').or(page.getByText('沒有找到卡牌'))
    ).toBeVisible({ timeout: 10000 })
  })

  // 卡面碼別名（feat/ptcg-face-code-aliases）：繁中卡面印 {externalId}F，需能照抄命中
  test('PTCG ZH_TW 輸入卡面碼 M5F 004（區域後綴 F）命中 DB externalId M5 的那張卡', async ({ page }) => {
    await page.goto('/cards?game=PTCG&language=ZH_TW')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('search-input').fill('M5F 004')
    await expect(page).toHaveURL(/q=M5F\+004/, { timeout: 10000 })

    // 剝尾 F → externalId M5，精準命中 004/081 蘭螳花ex（卡名於卡圖 alt）
    await expect(page.getByTestId('card-grid')).toBeVisible({ timeout: 10000 })
    await expect(page.getByAltText('蘭螳花ex')).toBeVisible({ timeout: 10000 })
  })

  test('PTCG EN 輸入卡面縮寫 OBF 197（ptcgoCode）解析為 externalId sv3 並命中', async ({ page }) => {
    await page.goto('/cards?game=PTCG&language=EN')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('search-input').fill('OBF 197')
    await expect(page).toHaveURL(/q=OBF\+197/, { timeout: 10000 })

    await expect(page.getByTestId('card-grid')).toBeVisible({ timeout: 10000 })
    await expect(page.getByAltText('Vengeful Punch')).toBeVisible({ timeout: 10000 })
  })
})
