import { test, expect } from './helpers/test'
import { proxyRouteGlob } from './helpers/image-proxy'

/**
 * 卡圖破圖自動重試（CardImage）：走 proxy（Worker 或 Vercel /api/proxy-image，依
 * NEXT_PUBLIC_IMAGE_PROXY_* env 分流，見 e2e/helpers/image-proxy.ts）的官網來源卡在暫時性
 * fetch 失敗時，onError 應自動重試一次（remount 重打同一 URL）而非直接落瀏覽器預設破圖 icon。
 *
 * 以 page.route 攔截 proxy 圖：同一 URL 第一次回 500、第二次回真 PNG，
 * 驗證最終圖片實際載入（naturalWidth > 0）、無 fallback、且確有發生重打（同 URL 被請求 ≥ 2 次）。
 *
 * 訪客可瀏覽 /cards、不需登入；不打真實 proxy 故無需注入 x-forwarded-for。
 */

// 1×1 紅色 PNG（可解碼，naturalWidth = 1）
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

test.describe('卡圖破圖自動重試', () => {
  test('proxy 圖首次 500 後自動重試一次並成功載入', async ({ page }) => {
    const attempts = new Map<string, number>()

    const handler = async (route: import('@playwright/test').Route) => {
      const url = route.request().url()
      const n = (attempts.get(url) ?? 0) + 1
      attempts.set(url, n)
      if (n === 1) {
        // 首次：模擬暫時性上游失敗
        await route.fulfill({ status: 500, body: 'transient failure' })
      } else {
        // 重試：回真圖
        await route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1 })
      }
    }

    // JA 圖片來自 www 或 asia 子網域（見 card-language.spec.ts 同一組 PROXY_HOSTNAMES 註解），
    // 兩者分流結果目前相同，但各自算 glob 以避免未來白名單分岔時漏攔。
    const globs = new Set([
      proxyRouteGlob('www.pokemon-card.com'),
      proxyRouteGlob('asia.pokemon-card.com'),
    ])
    for (const glob of globs) {
      await page.route(glob, handler)
    }

    await page.goto('/cards?game=PTCG&language=JA')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    // ピカチュウ 確保結果含有圖片、且 JA 圖來自 pokemon-card.com → 經 proxy 代理
    await page.getByTestId('search-input').fill('ピカチュウ')
    await expect(page).toHaveURL(/q=/, { timeout: 10000 })
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    const firstImg = page.getByTestId('card-item').locator('img').first()
    await firstImg.waitFor({ timeout: 10000 })

    // 重試需時（延遲 500~800ms + remount），以 toPass 輪詢直到實際載入成功
    await expect(async () => {
      const img = page.getByTestId('card-item').locator('img').first()
      await img.scrollIntoViewIfNeeded()
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth)
      expect(naturalWidth).toBeGreaterThan(0)
    }).toPass({ timeout: 15000 })

    // 該卡未落 fallback
    const firstCard = page.getByTestId('card-item').first()
    expect(await firstCard.getByTestId('card-image-fallback').count()).toBe(0)

    // 確有發生「同一 URL 被重打」——證明是重試恢復，而非首次即成功
    const retried = [...attempts.values()].some((n) => n >= 2)
    expect(retried).toBe(true)
  })
})
