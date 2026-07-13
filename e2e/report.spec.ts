// Requires running server and test database
import { test, expect } from './helpers/test'
import { getTestUser, loginAs } from './helpers/auth'
import { uniqueTestIp, forwardedHeaders } from './helpers/rate-limit-ip'
import { clearRateLimitKey, getUserIdByEmail } from './helpers/db'

// POST /api/report 有 IP（10/60m）與 user（5/60m）雙維度限流。user 維度靠本檔專屬帳號隔離；
// IP 維度需唯一 identity，否則並行時與其他 spec 擠同一視窗（見 helpers/rate-limit-ip.ts）。
test.use({ extraHTTPHeaders: forwardedHeaders(uniqueTestIp()) })

const USER = getTestUser('report')

// Minimal valid 1x1 red PNG, base64-encoded.
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

test.describe('缺卡/bug 回報', () => {
  // 全域 retries（playwright.config.ts）在此關閉：POST /api/report 有 user 維度 5/hr rate limit
  // （reportUserLimiter，src/lib/rate-limit.ts），以同一 seeded 帳號計算。每次重試都是一次真實
  // submit，會多燒 quota，把「短時間內反覆整套重跑撞 429」的既有問題放大。
  test.describe.configure({ retries: 0 })

  // user 維度 quota 以帳號計、跨執行累積：本檔每輪送出 2 次，短時間內反覆重跑整套（開發期常見）
  // 會在第 3 輪撞到 5/hr 上限而 429。IP 維度已由上方唯一 XFF 隔離，user 維度則於此清掉自己的
  // sliding window（比照 email-verification.spec.ts 對 rl:resend-verify:email 的既有作法）。
  test.beforeAll(async () => {
    const userId = await getUserIdByEmail(USER.email)
    await clearRateLimitKey('rl:report:user', userId)
  })

  test.beforeEach(async ({ page }) => {
    await loginAs(page, USER)
    await page.goto('/settings')
    await page.waitForURL('/settings')
  })

  test('從設定頁開啟回報 dialog，填寫並成功送出', async ({ page }) => {
    await page.getByTestId('settings-report-trigger').click()
    await expect(page.getByRole('dialog', { name: '意見回報' })).toBeVisible()

    await page.getByTestId('report-message-input').fill('這是一個測試用的回報訊息，長度足夠通過驗證。')
    await page.getByTestId('report-submit-btn').click()

    await expect(page.getByText('已送出回報，感謝您的協助！')).toBeVisible()
  })

  test('訊息過短顯示欄位錯誤', async ({ page }) => {
    await page.getByTestId('settings-report-trigger').click()
    await expect(page.getByRole('dialog', { name: '意見回報' })).toBeVisible()

    await page.getByTestId('report-message-input').fill('太短')
    await page.getByTestId('report-submit-btn').click()

    await expect(page.getByTestId('report-message-error')).toBeVisible()
  })

  test('附加一張圖片後成功送出', async ({ page }) => {
    await page.getByTestId('settings-report-trigger').click()
    await expect(page.getByRole('dialog', { name: '意見回報' })).toBeVisible()

    await page.getByTestId('report-message-input').fill('這是一個附帶圖片的測試回報訊息。')
    await page.setInputFiles('[data-testid="report-attachment-input"]', {
      name: 'issue.png',
      mimeType: 'image/png',
      buffer: Buffer.from(TINY_PNG_BASE64, 'base64'),
    })
    await expect(page.getByTestId('report-attachment-list')).toContainText('issue.png')

    await page.getByTestId('report-submit-btn').click()
    await expect(page.getByText('已送出回報，感謝您的協助！')).toBeVisible()
  })
})
