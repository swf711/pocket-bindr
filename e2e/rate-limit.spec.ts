/**
 * Rate limit E2E tests.
 *
 * Requires a real Upstash Redis connection (UPSTASH_REDIS_REST_URL).
 * All tests are skipped in CI environments that don't have Redis configured.
 */
import { test, expect } from '@playwright/test'
import { clearRateLimitKey } from './helpers/db'

const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL

// Localhost requests arrive as 127.0.0.1 at the Next.js server in E2E
const TEST_IP = '127.0.0.1'
const TEST_EMAIL = 'ratelimit-e2e@tcgbinder.com'

test.describe('Rate limit — POST /api/auth/forgot-password', () => {
  test.skip(!hasRedis, 'Requires UPSTASH_REDIS_REST_URL (real Redis)')

  test.beforeEach(async () => {
    // Clear IP + email sliding-window keys so tests start fresh
    await clearRateLimitKey('rl:forgot:ip', TEST_IP)
    await clearRateLimitKey('rl:forgot:email', TEST_EMAIL)
  })

  test('IP limit: 6th request within 15 min returns 429', async ({ request }) => {
    const payload = { email: TEST_EMAIL }

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

  test.beforeEach(async () => {
    await clearRateLimitKey('rl:register:ip', TEST_IP)
  })

  test('IP limit: 11th request within 1 hr returns 429', async ({ request }) => {
    // Send 10 register attempts — all hit IP limit check first (will fail for other reasons but count toward limit)
    for (let i = 0; i < 10; i++) {
      const res = await request.post('/api/auth/register', {
        data: { email: `rl-reg-${i}@tcgbinder.com`, username: `rlreg${i}`, password: 'TestPass1!' },
      })
      // Each request passes the IP rate limit (returns non-429)
      expect(res.status(), `request ${i + 1} should not be rate limited`).not.toBe(429)
    }

    // 11th request — should be rate limited at IP level
    const res = await request.post('/api/auth/register', {
      data: { email: 'rl-reg-over@tcgbinder.com', username: 'rlregover', password: 'TestPass1!' },
    })
    expect(res.status()).toBe(429)
    const body = await res.json()
    expect(body.error).toBe('RATE_LIMITED')
  })
})
