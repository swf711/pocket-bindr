import { test, expect } from './helpers/test'
import { getCardWithImage } from './helpers/db'

// 只在建置時設了 NEXT_PUBLIC_CARD_PAGES_ORIGIN（子網域總開關）才有轉址規則可測；
// CI 預設不設此 env（見 CLAUDE.md「E2E Tests」），故本檔在 CI 中一律 skip，只在
// 專門為此設定的 preview / 本機建置下執行（見 docs/TECH_DEBT.md）。
const CARD_PAGES_ORIGIN = process.env.NEXT_PUBLIC_CARD_PAGES_ORIGIN

test.describe('卡片頁 301 轉址（NEXT_PUBLIC_CARD_PAGES_ORIGIN 已設）', () => {
  test.skip(!CARD_PAGES_ORIGIN, '總開關未設，此建置不含卡片轉址規則')

  test('一般 GET 得到 301 且 Location 指向子網域', async ({ page }) => {
    const card = await getCardWithImage('PTCG', 'EN')
    const res = await page.request.get(`/cards/ptcg/en/${card.externalId}`, { maxRedirects: 0 })
    expect(res.status()).toBe(301)
    const location = res.headers()['location']
    expect(location).toBe(`${CARD_PAGES_ORIGIN}/ptcg/en/${card.externalId}`)
  })

  test('帶 RSC header 的請求不被轉址（回 200 flight payload）', async ({ page }) => {
    const card = await getCardWithImage('PTCG', 'EN')
    const res = await page.request.get(`/cards/ptcg/en/${card.externalId}`, {
      headers: { RSC: '1' },
      maxRedirects: 0,
    })
    expect(res.status()).toBe(200)
  })

  test('帶 Next-Action header 的請求不被轉址', async ({ page }) => {
    const card = await getCardWithImage('PTCG', 'EN')
    const res = await page.request.post(`/cards/ptcg/en/${card.externalId}`, {
      headers: { 'Next-Action': 'deadbeef' },
      maxRedirects: 0,
    })
    expect(res.status()).not.toBe(301)
  })

  test('Modal 開著時，從指令面板切換 UI 語言仍可正常運作（不被誤轉址）', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('card-item').first().click()
    await expect(page.getByTestId('card-detail-drawer')).toBeVisible()

    await page.keyboard.press('Meta+k')
    if (await page.getByRole('dialog').count() === 0) {
      await page.keyboard.press('Control+k')
    }
    const commandDialog = page.getByRole('dialog').last()
    await expect(commandDialog).toBeVisible({ timeout: 5000 })

    await page.keyboard.type('English')
    await page.keyboard.press('Enter')

    // 語言切換的內部導航（Server Action / RSC）不應被卡片轉址規則攔下，Drawer 仍持續可見。
    await expect(page.getByTestId('card-detail-drawer')).toBeVisible({ timeout: 8000 })
  })
})
