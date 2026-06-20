// Requires running server and test database
import { test, expect } from '@playwright/test'
import { getTestUser, loginAs } from './helpers/auth'

const USER = getTestUser('homepage')

test.describe('首頁', () => {
  test('Scenario 1: 訪客瀏覽首頁 — 顯示三大區塊與 CTA', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('featured-cards-section')).toBeVisible()
    await expect(page.getByTestId('latest-sets-section')).toBeVisible()
    await expect(page.getByTestId('feature-intro-section')).toBeVisible()

    const hero = page.getByTestId('hero-section')
    const searchLink = hero.getByRole('link', { name: /開始搜尋/ })
    await expect(searchLink).toBeVisible()
    await expect(searchLink).toHaveAttribute('href', '/cards')

    await expect(hero.getByRole('link', { name: /我的卡冊/ })).not.toBeVisible()
  })

  test('Scenario 2: 已登入使用者 — 額外顯示「前往我的卡冊」按鈕', async ({ page }) => {
    await loginAs(page, USER)
    await page.goto('/')

    const hero = page.getByTestId('hero-section')
    const binderLink = hero.getByRole('link', { name: /我的卡冊/ })
    await expect(binderLink).toBeVisible()
    await expect(binderLink).toHaveAttribute('href', '/binders')

    await expect(hero.getByRole('link', { name: /開始搜尋/ })).toBeVisible()
  })
})
