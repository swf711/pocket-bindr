import { test, expect } from './helpers/test'
import { getCardWithImage } from './helpers/db'

// 靜態卡片頁「在 PocketBindr 開啟」入口：/cards?game=&language=&open=<externalId>。
// 總開關未設時也要能跑（開關只影響靜態頁本身在哪裡，主站的 open 入口邏輯永遠存在）。
test.describe('/cards open 入口', () => {
  test('帶 open 參數會開出該卡的 Drawer，網址不再帶 open', async ({ page }) => {
    const card = await getCardWithImage('PTCG', 'EN')

    await page.goto(`/cards?game=PTCG&language=EN&open=${encodeURIComponent(card.externalId)}`)

    await expect(page.getByTestId('card-detail-drawer')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: card.name })).toBeVisible()

    // open 參數用完即從網址移除
    await expect(page).not.toHaveURL(/[?&]open=/)
  })

  test('關閉後不會再次開啟（open 只處理一次）', async ({ page }) => {
    const card = await getCardWithImage('PTCG', 'EN')

    await page.goto(`/cards?game=PTCG&language=EN&open=${encodeURIComponent(card.externalId)}`)
    await expect(page.getByTestId('card-detail-drawer')).toBeVisible({ timeout: 10000 })

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('card-detail-drawer')).not.toBeVisible()

    // 給一點時間讓任何殘留的 effect 有機會誤觸發
    await page.waitForTimeout(500)
    await expect(page.getByTestId('card-detail-drawer')).not.toBeVisible()
  })

  test('不存在的 externalId 留在列表並顯示提示，不 push 導航', async ({ page }) => {
    await page.goto('/cards?game=PTCG&language=EN&open=does-not-exist-xyz-000')

    await expect(page.getByText(/找不到這張卡|Couldn.t find that card/)).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('card-detail-drawer')).not.toBeVisible()
    await expect(page).toHaveURL(/\/cards\?/)
    await expect(page).not.toHaveURL(/\/cards\/ptcg\//)
  })
})
