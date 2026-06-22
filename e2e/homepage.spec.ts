// Requires running server and test database
import { test, expect } from '@playwright/test'
import { getTestUser, loginAs } from './helpers/auth'

const USER = getTestUser('homepage')

test.describe('首頁', () => {
  test('Scenario 1: 訪客瀏覽首頁 — 顯示主要區塊與 CTA', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('game-tabs-section')).toBeVisible()
    await expect(page.getByTestId('most-wanted-section')).toBeVisible()
    await expect(page.getByTestId('feature-intro-section')).toBeVisible()
    await expect(page.getByTestId('promo-cta-section')).toBeVisible()

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

  test('Scenario 3: PTCG / OPCG Tab 切換', async ({ page }) => {
    await page.goto('/')

    const section = page.getByTestId('game-tabs-section')
    await expect(section).toBeVisible()

    // 預設 PTCG tab 啟用
    const ptcgTab = section.getByRole('tab', { name: 'Pokémon' }).first()
    await expect(ptcgTab).toHaveAttribute('data-state', 'active')

    // 點擊 OPCG tab
    await section.getByRole('tab', { name: 'One Piece' }).first().click()

    // most-wanted-section 的 tab 也應同步切換
    const wantedSection = page.getByTestId('most-wanted-section')
    await expect(wantedSection.getByRole('tab', { name: 'One Piece' }).first()).toHaveAttribute('data-state', 'active')
  })

  test('Scenario 4: 點擊跑馬燈卡牌開啟 Drawer（不含加入卡冊）', async ({ page }) => {
    await page.goto('/')

    const section = page.getByTestId('game-tabs-section')
    const firstCard = section.locator('button').first()
    await firstCard.click()

    // Drawer 應開啟
    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()

    // 不應顯示加入卡冊按鈕
    await expect(drawer.getByText(/加入卡冊/)).not.toBeVisible()
  })

  test('Scenario 5: Footer 顯示於首頁', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('site-footer')).toBeVisible()
    await expect(page.getByTestId('site-footer')).toContainText('TCG Binder')
  })
})
