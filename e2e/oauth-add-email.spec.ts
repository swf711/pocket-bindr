import { test, expect } from './helpers/test'
import { loginAsOAuthUserById } from './helpers/auth'
import { uniqueTestIp, forwardedHeaders } from './helpers/rate-limit-ip'
import {
  createOAuthUserNoEmail,
  createValidEmailVerifyToken,
  getUserEmailById,
  deleteUserById,
} from './helpers/db'

// This spec makes several real POST /api/user/email/verify calls (emailVerifyIpLimiter:
// 10/hr per IP). @upstash/ratelimit's in-process ephemeralCache remembers blocked
// identifiers on the long-running server regardless of Redis state, so clearing Redis
// between runs isn't enough — a unique x-forwarded-for identity per run is the
// established workaround in this codebase (see helpers/rate-limit-ip.ts).
const TEST_IP = uniqueTestIp()

test.describe('純 OAuth 使用者自助補填 email', () => {
  test.use({ extraHTTPHeaders: forwardedHeaders(TEST_IP) })

  test('email == null 時設定頁顯示補填表單', async ({ page }) => {
    const { userId } = await createOAuthUserNoEmail('e2eaddemail1', 'discord', 'discord-add-email-1')
    try {
      await loginAsOAuthUserById(page, userId, 'e2eaddemail1')
      await page.goto('/settings')
      await expect(page.getByTestId('add-email-input')).toBeVisible()
      await expect(page.getByTestId('save-add-email-btn')).toBeVisible()
    } finally {
      await deleteUserById(userId)
    }
  })

  test('完整流程：補填 → verify → email 寫入 + 設定密碼卡出現', async ({ page }) => {
    const { userId } = await createOAuthUserNoEmail('e2eaddemail2', 'discord', 'discord-add-email-2')
    const email = 'e2e-add-email-2@pocketbindr.com'
    try {
      await loginAsOAuthUserById(page, userId, 'e2eaddemail2')

      // Bypass real email sending: mint the token directly (mirrors createValidResetToken).
      const token = createValidEmailVerifyToken(userId, email)
      await page.goto(`/verify-email?token=${encodeURIComponent(token)}`)
      await expect(page.getByRole('heading', { name: 'Email 已驗證' })).toBeVisible()

      const dbEmail = await getUserEmailById(userId)
      expect(dbEmail).toBe(email)

      await page.goto('/settings')
      await expect(page.getByTestId('set-password-input')).toBeVisible()
      await expect(page.getByTestId('add-email-input')).not.toBeVisible()
    } finally {
      await deleteUserById(userId)
    }
  })

  test('email 已被他人使用 → verify 顯示已被使用錯誤', async ({ page }) => {
    const { userId: takenUserId } = await createOAuthUserNoEmail('e2eaddemail3taken', 'discord', 'discord-add-email-3taken')
    const { userId } = await createOAuthUserNoEmail('e2eaddemail3', 'discord', 'discord-add-email-3')
    const takenEmail = 'e2e-add-email-3-taken@pocketbindr.com'
    try {
      // 先讓另一帳號真的持有這個 email（模擬 TOCTOU 中間被搶走的情境）。
      const takenToken = createValidEmailVerifyToken(takenUserId, takenEmail)
      await loginAsOAuthUserById(page, takenUserId, 'e2eaddemail3taken')
      await page.goto(`/verify-email?token=${encodeURIComponent(takenToken)}`)
      await expect(page.getByRole('heading', { name: 'Email 已驗證' })).toBeVisible()

      // 換第二個帳號拿同一個 email 簽 token 去 verify。
      const conflictToken = createValidEmailVerifyToken(userId, takenEmail)
      await loginAsOAuthUserById(page, userId, 'e2eaddemail3')
      await page.goto(`/verify-email?token=${encodeURIComponent(conflictToken)}`)
      await expect(page.getByTestId('verify-email-error-alert')).toContainText('已被其他帳號使用')

      const dbEmail = await getUserEmailById(userId)
      expect(dbEmail).toBeNull()
    } finally {
      await deleteUserById(userId)
      await deleteUserById(takenUserId)
    }
  })

  test('非本人 token → 403 顯示對應錯誤（D5 深度防禦）', async ({ page }) => {
    const { userId: victimId } = await createOAuthUserNoEmail('e2eaddemail4victim', 'discord', 'discord-add-email-4victim')
    const { userId: attackerId } = await createOAuthUserNoEmail('e2eaddemail4attacker', 'discord', 'discord-add-email-4attacker')
    try {
      const victimToken = createValidEmailVerifyToken(victimId, 'e2e-add-email-4@pocketbindr.com')

      // 攻擊者登入自己的帳號，卻拿受害者的 token 去 verify。
      await loginAsOAuthUserById(page, attackerId, 'e2eaddemail4attacker')
      await page.goto(`/verify-email?token=${encodeURIComponent(victimToken)}`)
      await expect(page.getByTestId('verify-email-error-alert')).toBeVisible()

      const dbEmail = await getUserEmailById(victimId)
      expect(dbEmail).toBeNull()
    } finally {
      await deleteUserById(victimId)
      await deleteUserById(attackerId)
    }
  })

  test('無效 token → 顯示連結無效', async ({ page }) => {
    const { userId } = await createOAuthUserNoEmail('e2eaddemail5', 'discord', 'discord-add-email-5')
    try {
      await loginAsOAuthUserById(page, userId, 'e2eaddemail5')
      await page.goto('/verify-email?token=not-a-real-token')
      await expect(page.getByTestId('verify-email-error-alert')).toBeVisible()
    } finally {
      await deleteUserById(userId)
    }
  })

  test('未登入訪問 /verify-email → 導向 /login（不同於 reset-password 導 /cards）', async ({ page }) => {
    await page.goto('/verify-email?token=anything')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('已有 email 的使用者設定頁不顯示補填入口（D3 只補不改）', async ({ page }) => {
    const { userId } = await createOAuthUserNoEmail('e2eaddemail6', 'discord', 'discord-add-email-6')
    const email = 'e2e-add-email-6@pocketbindr.com'
    try {
      const token = createValidEmailVerifyToken(userId, email)
      await loginAsOAuthUserById(page, userId, 'e2eaddemail6')
      await page.goto(`/verify-email?token=${encodeURIComponent(token)}`)
      await expect(page.getByRole('heading', { name: 'Email 已驗證' })).toBeVisible()

      await page.goto('/settings')
      await expect(page.getByTestId('add-email-input')).not.toBeVisible()
    } finally {
      await deleteUserById(userId)
    }
  })
})
