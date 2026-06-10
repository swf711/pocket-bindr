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
  test('預設顯示 EN 卡牌且 URL 不含 language 參數', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    expect(page.url()).not.toContain('language=')
    await expect(page.getByTestId('language-filter')).toContainText('English')
  })

  test('切換至繁體中文：URL 更新、系列篩選重置、顯示繁中卡牌', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    // 先選擇一個 EN 系列，確認切換語言後會被重置
    await page.getByTestId('set-filter').click()
    await page.getByRole('option').nth(1).click()
    await expect(page).toHaveURL(/setId=/, { timeout: 10000 })
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    // 切換語言至繁體中文
    await selectLanguage(page, '繁體中文')
    await expect(page).toHaveURL(/language=ZH_TW/, { timeout: 10000 })
    expect(page.url()).not.toContain('setId=')
    await expect(page.getByTestId('set-filter')).toContainText('所有系列')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    // 搜尋「皮卡丘」應有繁中結果
    await page.getByTestId('search-input').fill('皮卡丘')
    await expect(page).toHaveURL(/q=/, { timeout: 10000 })
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await expect(
      page.getByTestId('card-item').filter({ hasText: '皮卡丘' }).first()
    ).toBeVisible({ timeout: 10000 })
  })

  test('切換語言後系列下拉顯示該語言的系列', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await selectLanguage(page, '繁體中文')
    await expect(page).toHaveURL(/language=ZH_TW/, { timeout: 10000 })
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('set-filter').click()
    await expect(
      page.getByRole('option', { name: /朱&紫系列/ }).first()
    ).toBeVisible({ timeout: 10000 })
    await page.keyboard.press('Escape')
  })

  test('URL 帶無效 language 值時 fallback 為 EN', async ({ page }) => {
    await page.goto('/cards?game=PTCG&language=INVALID')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await expect(page.getByTestId('language-filter')).toContainText('English')
  })
})
