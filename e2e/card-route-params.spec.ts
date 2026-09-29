import { test, expect } from './helpers/test'
import { getCardWithImage } from './helpers/db'

/**
 * 卡片路由參數驗證（perf/homepage-isr-and-cache）：攔截 modal 與獨立卡片頁共用
 * `parseCardRouteParams`（src/lib/card-url.ts），不合法的 game/language/externalId 一律
 * notFound()，避免垃圾網址在 on-demand ISR 下無界產生快取條目。
 *
 * `/cards/xxx/en/sv3-1`（game 不合法）與「查無卡片的 externalId」已有 e2e/card-detail-url.spec.ts
 * 覆蓋，此處聚焦新增的驗證維度：externalId 過長／URL-encode 後含非法字元。
 * 直接 page.goto() 一律命中獨立頁（真正的完整導航，非攔截 modal 的軟導航），與獨立頁共用同一份
 * 驗證函式，故此處的覆蓋等同覆蓋兩個路由共用的邏輯（parseCardRouteParams 本身另有詳盡 unit test）。
 */
test.describe('卡片路由參數驗證', () => {
  test('externalId 超過 64 字元回 404', async ({ page }) => {
    const tooLong = 'a'.repeat(65)
    const response = await page.goto(`/cards/ptcg/en/${tooLong}`)
    expect(response?.status()).toBe(404)
  })

  test('externalId 含 URL-encode 後的非法字元（斜線）回 404', async ({ page }) => {
    const response = await page.goto('/cards/ptcg/en/a%2Fb')
    expect(response?.status()).toBe(404)
  })

  test('合法長度／字元集的 externalId 正常解析（未設靜態子網域開關時不 301）', async ({ page }) => {
    const card = await getCardWithImage('PTCG', 'EN')
    const response = await page.goto(`/cards/ptcg/en/${card.externalId}`)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: card.name })).toBeVisible()
  })
})
