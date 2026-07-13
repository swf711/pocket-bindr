import { test, expect } from '@playwright/test'
import { getTestUser, loginAs } from './helpers/auth'
import { clearUserCardsByEmail, clearUserBindersByEmail, getCardWithImage } from './helpers/db'

const USER = getTestUser('carddetailurl')

test.describe('卡片獨立 URL — 直接訪問（SSR）', () => {
  test('直接訪問卡片 URL 顯示完整內容、self-canonical、無 hreflang', async ({ page }) => {
    const card = await getCardWithImage('PTCG', 'EN')
    const path = `/cards/ptcg/en/${card.externalId}`

    const response = await page.goto(path)
    expect(response?.status()).toBe(200)

    // view-source 級檢查：卡名應出現在 SSR 出的 HTML（非空殼，非純 JS 渲染後才出現）
    await expect(page.getByRole('heading', { name: card.name })).toBeVisible()

    // self-canonical：canonical 指向自身路徑，不指向 canonicalCardId 對應的其他語言卡
    const canonicalHref = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(canonicalHref).toContain(path)

    // 刻意不做 hreflang（PTCG 無跨語言 join key，見 discuss-feature 鎖定決策）
    const hreflangCount = await page.locator('link[rel="alternate"][hreflang]').count()
    expect(hreflangCount).toBe(0)

    // og:locale 存在且對應卡片語言（EN → en_US）
    const ogLocale = await page.locator('meta[property="og:locale"]').getAttribute('content')
    expect(ogLocale).toBe('en_US')
  })

  test('非法路徑參數回 404', async ({ page }) => {
    const response = await page.goto('/cards/not-a-game/en/sv3-25')
    expect(response?.status()).toBe(404)
  })

  test('查無卡片的 externalId 回 404', async ({ page }) => {
    const response = await page.goto('/cards/ptcg/en/does-not-exist-xyz')
    expect(response?.status()).toBe(404)
  })
})

test.describe('卡片獨立 URL — 從列表點卡（攔截 modal）', () => {
  test('點卡後 URL 更新為卡片獨立網址，且以 Drawer 浮層呈現', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('card-item').first().click()

    await expect(page.getByTestId('card-detail-drawer')).toBeVisible()
    await expect(page).toHaveURL(/\/cards\/ptcg\/[a-z-]+\/.+/)
  })

  test('重整卡片 URL 顯示真實獨立頁（非 modal）', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('card-item').first().click()
    await expect(page.getByTestId('card-detail-drawer')).toBeVisible()

    const cardUrl = page.url()
    await page.reload()

    // 重整後 @modal 落到 default.tsx（null），改由真實頁渲染（無 Drawer，全頁版面）
    await expect(page.getByTestId('card-detail-drawer')).not.toBeVisible()
    expect(page.url()).toBe(cardUrl)
  })

  test('Modal 內按下一張／上一張切換當前頁鄰卡並同步 URL', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('card-item').first().click()
    await expect(page.getByTestId('card-detail-drawer')).toBeVisible()

    const firstUrl = page.url()
    await page.getByTestId('modal-nav-next').click()
    await expect(page.getByTestId('card-detail-drawer')).toBeVisible()
    await expect(page).not.toHaveURL(firstUrl)
    const secondUrl = page.url()

    await page.getByTestId('modal-nav-prev').click()
    await expect(page).toHaveURL(firstUrl)
    expect(secondUrl).not.toBe(firstUrl)
  })

  test('關閉 Modal 回到列表（瀏覽器上一頁行為）', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('card-item').first().click()
    await expect(page.getByTestId('card-detail-drawer')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('card-detail-drawer')).not.toBeVisible()
    await expect(page).toHaveURL(/\/cards(\?.*)?$/)
  })
})

test.describe('卡片獨立 URL — 同系列區塊', () => {
  test('同系列其他卡連結可點擊並導到另一張卡頁', async ({ page }) => {
    const card = await getCardWithImage('PTCG', 'EN')
    await page.goto(`/cards/ptcg/en/${card.externalId}`)

    const sameSetLink = page.locator('a[href^="/cards/ptcg/en/"]').first()
    if (await sameSetLink.count() === 0) test.skip(true, '此系列無足夠其他卡可測試')

    const href = await sameSetLink.getAttribute('href')
    // R2：同系列縮圖為原生 <a>，「一次」點擊即完整導航到目標真實頁（不被 @modal 攔截成靜默空 modal）
    await sameSetLink.click()
    await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    // 落地為真實獨立頁（該卡卡名的 h1 可見），非 Drawer 浮層
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByTestId('card-detail-drawer')).not.toBeVisible()
  })
})

test.describe('卡片獨立 URL — 訪客加入卡冊引導', () => {
  test('未登入訪客在獨立頁點加入卡冊彈出登入 modal', async ({ page }) => {
    const card = await getCardWithImage('PTCG', 'EN')
    await page.goto(`/cards/ptcg/en/${card.externalId}`)

    await page.getByText(/請先登入以加入卡冊|Please log in to add to a binder/).waitFor({ timeout: 8000 })
    await page.getByTestId('modal-add-btn').click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})

test.describe('回歸：既有三處 Drawer 不受影響', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
  })

  test.afterAll(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
  })

  test('搜尋頁登入使用者點卡仍可加入卡冊（cardHref 不影響既有流程）', async ({ page }) => {
    const res = await page.request.post('/api/binders', {
      data: { name: 'E2E Card URL Binder', gridType: 'grid_3x3' },
    })
    expect(res.status()).toBe(201)

    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('card-item').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByTestId('modal-binder-select')).toBeVisible({ timeout: 8000 })
    await page.getByTestId('modal-add-btn').click()
    await expect(page.getByText(/已加入|Added/)).toBeVisible({ timeout: 8000 })
  })
})
