// Requires running server and test database
import { test, expect } from '@playwright/test'
import { getTestUser, loginAs } from './helpers/auth'

const USER = getTestUser('report')

// Minimal valid 1x1 red PNG, base64-encoded.
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

test.describe('缺卡/bug 回報', () => {
  // 全域 retries（playwright.config.ts）在此關閉：POST /api/report 有 user 維度 5/hr rate limit
  // （reportUserLimiter，src/lib/rate-limit.ts），以同一 seeded 帳號計算。每次重試都是一次真實
  // submit，會多燒 quota，把「短時間內反覆整套重跑撞 429」的既有問題放大。
  test.describe.configure({ retries: 0 })

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
