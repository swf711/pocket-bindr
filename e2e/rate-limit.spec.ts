/**
 * Rate limit E2E tests.
 *
 * Requires a real Upstash Redis connection (UPSTASH_REDIS_REST_URL).
 * All tests are skipped in CI environments that don't have Redis configured.
 */
import { test, expect } from '@playwright/test'
import { clearRateLimitKey } from './helpers/db'

const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL

// 以顯式 x-forwarded-for 固定 IP identity（next start 會保留 client 提供的值）。
// 不可依賴 socket 位址：本機可能是 ::1（IPv6），與 clearRateLimitKey 清理的 key 對不上，
// 且會與 suite 其他 spec 的請求共用同一 identity（suite 加速後 15/60 分鐘窗互相污染）。
// 每輪產生唯一 IP：@upstash/ratelimit 的 in-process ephemeralCache 會把被 block 的
// identifier 記在 server 記憶體直到窗口重置，清 Redis 無效；唯一 IP 讓兩層都天然乾淨。
const TEST_IP = `10.${(Date.now() >> 16) & 255}.${(Date.now() >> 8) & 255}.${Date.now() & 255}`
const FORWARDED_HEADERS = { 'x-forwarded-for': TEST_IP }
const TEST_EMAIL = 'ratelimit-e2e@pocketbindr.com'

test.describe('Rate limit — POST /api/auth/forgot-password', () => {
  test.skip(!hasRedis, 'Requires UPSTASH_REDIS_REST_URL (real Redis)')
  test.use({ extraHTTPHeaders: FORWARDED_HEADERS })

  test.beforeEach(async () => {
    // Clear IP + email sliding-window keys so tests start fresh
    await clearRateLimitKey('rl:forgot:ip', TEST_IP)
    await clearRateLimitKey('rl:forgot:email', TEST_EMAIL)
  })

  test('IP limit: 6th request within 15 min returns 429', async ({ request }) => {
    // 空 payload：route 先數 IP 限流、再因缺 email 早退回 200——
    // 不觸 email limiter（3/60m，同 email 連發 5 次必撞）、不寄信。
    const payload = {}

    // Send 5 requests — all should succeed (200)
    for (let i = 0; i < 5; i++) {
      const res = await request.post('/api/auth/forgot-password', { data: payload })
      expect(res.status(), `request ${i + 1} should succeed`).toBe(200)
    }

    // 6th request — should be rate limited
    const res = await request.post('/api/auth/forgot-password', { data: payload })
    expect(res.status()).toBe(429)
    const body = await res.json()
    expect(body.error).toBe('RATE_LIMITED')
  })

  test('UI shows "請求過於頻繁" message when rate limited', async ({ page, request }) => {
    // Exhaust the IP limit via direct API calls
    for (let i = 0; i < 5; i++) {
      await request.post('/api/auth/forgot-password', { data: { email: TEST_EMAIL } })
    }

    // Now trigger via the UI form
    await page.goto('/forgot-password')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByRole('button', { name: '送出重設連結' }).click()

    await expect(page.getByTestId('rate-limit-alert')).toBeVisible()
    await expect(page.getByTestId('rate-limit-alert')).toContainText('請求過於頻繁')
  })
})

test.describe('Rate limit — POST /api/auth/register', () => {
  test.skip(!hasRedis, 'Requires UPSTASH_REDIS_REST_URL (real Redis)')
  test.use({ extraHTTPHeaders: FORWARDED_HEADERS })

  test.beforeEach(async () => {
    await clearRateLimitKey('rl:register:ip', TEST_IP)
  })

  test('IP limit: 11th request within 1 hr returns 429', async ({ request }) => {
    // 空 payload：route 先數 IP 限流、再因缺欄位回 400（非 429）——
    // 不觸 email limiter（固定 email 重複跑會撞 5/60m）、不建測試殘留 user。
    for (let i = 0; i < 10; i++) {
      const res = await request.post('/api/auth/register', { data: {} })
      // Each request passes the IP rate limit (returns non-429)
      expect(res.status(), `request ${i + 1} should not be rate limited`).not.toBe(429)
    }

    // 11th request — should be rate limited at IP level
    const res = await request.post('/api/auth/register', { data: {} })
    expect(res.status()).toBe(429)
    const body = await res.json()
    expect(body.error).toBe('RATE_LIMITED')
  })
})
