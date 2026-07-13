// Requires running server and test database
import { test, expect } from './helpers/test'
import { getTestUser, loginAs } from './helpers/auth'

const USER = getTestUser('homepage')

test.describe('首頁', () => {
  test('Scenario 1: 訪客瀏覽首頁 — 顯示主要區塊與 CTA', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('hero-section')).toBeVisible()
    await expect(page.getByTestId('stats-carousel-section')).toBeVisible()
    await expect(page.getByTestId('feature-platform-section')).toBeVisible()
    await expect(page.getByTestId('why-section')).toBeVisible()

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

  test('Scenario 3: 平台功能區塊顯示 6 個功能項目', async ({ page }) => {
    await page.goto('/')

    const featureSection = page.getByTestId('feature-platform-section')
    await expect(featureSection).toBeVisible()

    const featureTitles = ['搜尋卡牌', '建立卡冊', '管理收藏', '裝置同步', '分享你的卡冊', '更多功能']
    for (const title of featureTitles) {
      // exact match: 標題「建立卡冊」亦為某描述子字串（「建立卡冊連結…」），需精確比對避免 strict-mode 命中兩元素
      await expect(featureSection.getByText(title, { exact: true })).toBeVisible()
    }
  })

  // 桌面 sticky parallax：把第二區塊捲到「卡冊覆蓋」停點，使大圖 carousel 進入可視
  async function scrollToCarouselCover(page: import('@playwright/test').Page) {
    await page.evaluate(() => {
      const section = document.querySelector('[data-testid="stats-carousel-section"]') as HTMLElement | null
      if (!section) return
      // 捲到 progress=1：outerRect.top = -(offsetHeight - innerHeight)
      const travel = section.offsetHeight - window.innerHeight
      const target = window.scrollY + section.getBoundingClientRect().top + travel
      window.scrollTo({ top: target, behavior: 'auto' })
    })
    await page.waitForTimeout(100)
  }

  test('Scenario 4: 點擊 Carousel 卡牌開啟 Drawer（不含加入卡冊）', async ({ page }) => {
    await page.goto('/')

    const carouselSection = page.getByTestId('stats-carousel-section')
    const firstCard = carouselSection.getByTestId('carousel-card').first()

    // parallax：大圖 carousel 初始覆蓋於文字下方、不在 viewport；捲到覆蓋停點後可點
    await scrollToCarouselCover(page)
    await expect(firstCard).toBeInViewport()
    await firstCard.click()

    // Drawer 應開啟
    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()

    // 不應顯示加入卡冊按鈕
    await expect(drawer.getByText(/加入卡冊/)).not.toBeVisible()
  })

  test('Scenario 5: Hero 互動卡冊渲染 9 張卡牌', async ({ page }) => {
    await page.goto('/')

    const heroBinder = page.getByTestId('hero-binder')
    await expect(heroBinder).toBeVisible()

    const cards = heroBinder.locator('[data-testid^="hero-binder-card-"]')
    await expect(cards).toHaveCount(9)
  })

  test('Scenario 6: Stats Carousel 顯示 12 張卡牌', async ({ page }) => {
    await page.goto('/')

    const carouselCards = page.getByTestId('carousel-card')
    await expect(carouselCards).toHaveCount(12)
  })

  test('Scenario 7: 開發者介紹區塊顯示聯絡連結', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('why-section')).toBeVisible()

    // why-section 的 DOM 子樹刻意包住 inline-footer（首頁最後一區的釘底 footer），
    // footer 內另有一個 GitHub 連結 → 以整個 section 當 scope 會 strict-mode 命中 2 個。
    // 斷言範圍窄化到開發者聯絡按鈕組本身。
    const aboutLinks = page.getByTestId('about-links')

    await expect(aboutLinks.getByRole('link', { name: /LinkedIn/ })).toBeVisible()
    await expect(aboutLinks.getByRole('link', { name: /GitHub/ })).toBeVisible()

    const emailLink = aboutLinks.getByRole('link', { name: /Email/ })
    await expect(emailLink).toBeVisible()
    // href 必須是真實信箱，不可是 placeholder（曾誤留 mailto:your-email@example.com）
    await expect(emailLink).toHaveAttribute('href', /^mailto:(?!your-email@example\.com).+@.+/)
  })

  test('Scenario 8: 全站 Footer 在首頁隱藏，改由 inline footer 呈現', async ({ page }) => {
    await page.goto('/')

    // 全站 site-footer 不出現（首頁隱藏）
    await expect(page.getByTestId('site-footer')).not.toBeVisible()

    // 首頁第四區塊的 inline footer 出現
    await expect(page.getByTestId('inline-footer')).toBeVisible()
    await expect(page.getByTestId('inline-footer')).toContainText('PocketBindr')
  })

  test('Scenario 9: 平台功能區塊包含「分享」相關文字', async ({ page }) => {
    await page.goto('/')

    const featureSection = page.getByTestId('feature-platform-section')
    await expect(featureSection.getByText(/分享你的卡冊/)).toBeVisible()
  })

  test('Scenario 10: 第二區塊 sticky parallax — 大圖 carousel 上滑覆蓋後進入第三區塊', async ({ page }) => {
    await page.goto('/')

    const firstCard = page
      .getByTestId('stats-carousel-section')
      .getByTestId('carousel-card')
      .first()

    // 文字停點：大圖 carousel 尚未進入 viewport
    await expect(firstCard).not.toBeInViewport()

    // 滑到覆蓋停點：大圖 carousel 進入 viewport
    await scrollToCarouselCover(page)
    await expect(firstCard).toBeInViewport()

    // 繼續滑動進入第三區塊（平台功能）
    await page.getByTestId('feature-platform-section').scrollIntoViewIfNeeded()
    await expect(page.getByTestId('feature-platform-section')).toBeInViewport()
  })
})
