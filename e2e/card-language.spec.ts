import { test, expect, type Page } from '@playwright/test'

/**
 * 對應 docs/BDD.md 卡片搜尋頁 Scenario 2b: 選擇語言
 * 語言選擇器為 Radix Select：先 click trigger 再 click option。
 */

async function selectLanguage(page: Page, optionLabel: string) {
  await page.getByTestId('language-filter').click()
  await page.getByRole('option', { name: optionLabel }).click()
}

test.describe('Scenario 2b: 選擇語言', () => {
  test('預設顯示繁體中文卡牌且 URL 不含 language 參數', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    expect(page.url()).not.toContain('language=')
    await expect(page.getByTestId('language-filter')).toContainText('繁體中文')
  })

  test('切換至英文：URL 更新、系列篩選重置、顯示英文卡牌', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    // 先選擇一個 EN 系列，確認切換語言後會被重置
    await page.getByTestId('set-filter').click()
    await page.getByRole('option').nth(1).click()
    await expect(page).toHaveURL(/setId=/, { timeout: 10000 })
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    // 切換語言至英文
    await selectLanguage(page, 'English')
    await expect(page).toHaveURL(/language=EN/, { timeout: 10000 })
    expect(page.url()).not.toContain('setId=')
    await expect(page.getByTestId('set-filter')).toContainText('所有系列')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    // 搜尋「皮卡丘」應有繁中結果
    await selectLanguage(page, '繁體中文')
    // 等 URL 移除 language 參數後再輸入，避免與搜尋更新 race
    await expect(page).not.toHaveURL(/language=/, { timeout: 10000 })
    await page.getByTestId('search-input').fill('皮卡丘')
    await expect(page).toHaveURL(/q=/, { timeout: 10000 })
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    // 卡片名稱僅存在於 img alt（無文字節點），需以 img name 比對
    await expect(
      page
        .getByTestId('card-item')
        .filter({ has: page.getByRole('img', { name: /皮卡丘/ }) })
        .first()
    ).toBeVisible({ timeout: 10000 })
  })

  test('切換語言後系列下拉顯示該語言的系列', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('set-filter').click()
    await expect(
      page.getByRole('option', { name: /火箭隊的榮耀/ }).first()
    ).toBeVisible({ timeout: 10000 })
    await page.keyboard.press('Escape')
  })

  test('切換至日本語：卡片圖片 src 為 /api/proxy-image 代理 URL 且圖片實際載入成功', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await selectLanguage(page, '日本語')
    await expect(page).toHaveURL(/language=JA/, { timeout: 10000 })
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    // 部分 JA 卡牌無圖片（顯示 fallback），搜尋「ピカチュウ」確保結果含有圖片的卡，
    // 並鎖定第一個有 img 的卡片
    await page.getByTestId('search-input').fill('ピカチュウ')
    await expect(page).toHaveURL(/q=/, { timeout: 10000 })
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    const firstImg = page.getByTestId('card-item').locator('img').first()
    await firstImg.waitFor({ timeout: 10000 })
    // JA 圖片來自 www.pokemon-card.com，經 /api/proxy-image 代理（見 src/lib/get-card-image-url.ts）
    const src = await firstImg.getAttribute('src')
    expect(src).toMatch(/\/api\/proxy-image/)
    const proxiedUrl = new URL(src!, page.url()).searchParams.get('url')
    expect(new URL(proxiedUrl!).hostname).toBe('www.pokemon-card.com')

    // 圖片為 lazy loading，捲動至可視範圍後確認實際載入成功
    await firstImg.scrollIntoViewIfNeeded()
    await expect
      .poll(
        () => firstImg.evaluate((img: HTMLImageElement) => img.naturalWidth),
        { timeout: 15000 }
      )
      .toBeGreaterThan(0)
  })

  test('URL 帶無效 language 值時 fallback 為 繁體中文', async ({ page }) => {
    await page.goto('/cards?game=PTCG&language=INVALID')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await expect(page.getByTestId('language-filter')).toContainText('繁體中文')
  })
})
