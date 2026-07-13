import { test, expect } from './helpers/test'

// 卡牌名稱僅存在於 img alt（無文字節點），需以 img name 比對（同 card-language.spec.ts 慣例）
function cardWithName(page: import('@playwright/test').Page, namePattern: RegExp) {
  return page.getByTestId('card-item').filter({ has: page.getByRole('img', { name: namePattern }) })
}

test.describe('跨語言關鍵字搜尋', () => {
  test('PTCG JA 檢視輸入繁中物種名「皮卡丘」可命中 ピカチュウ', async ({ page }) => {
    await page.goto('/cards?game=PTCG&language=JA')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('search-input').fill('皮卡丘')
    await expect(page).toHaveURL(/q=/, { timeout: 10000 })
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await expect(cardWithName(page, /ピカチュウ/).first()).toBeVisible({ timeout: 10000 })
  })

  test('PTCG EN 檢視輸入繁中物種名「皮卡丘」可命中 Pikachu', async ({ page }) => {
    await page.goto('/cards?game=PTCG&language=EN')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('search-input').fill('皮卡丘')
    await expect(page).toHaveURL(/q=/, { timeout: 10000 })
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await expect(cardWithName(page, /Pikachu/).first()).toBeVisible({ timeout: 10000 })
  })

  test('OPCG JA 檢視輸入繁中角色名「魯夫」可命中 ルフィ', async ({ page }) => {
    await page.goto('/cards?game=OPCG&language=JA')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('search-input').fill('魯夫')
    await expect(page).toHaveURL(/q=/, { timeout: 10000 })
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await expect(cardWithName(page, /ルフィ/).first()).toBeVisible({ timeout: 10000 })
  })

  test('回歸：PTCG JA 檢視輸入既有日文名稱仍正常命中', async ({ page }) => {
    await page.goto('/cards?game=PTCG&language=JA')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('search-input').fill('ピカチュウ')
    await expect(page).toHaveURL(/q=/, { timeout: 10000 })
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await expect(cardWithName(page, /ピカチュウ/).first()).toBeVisible({ timeout: 10000 })
  })
})
