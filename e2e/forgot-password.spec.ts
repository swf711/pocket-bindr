import { test, expect } from './helpers/test'
import { getTestUser, loginAs } from './helpers/auth'
import { uniqueTestIp, forwardedHeaders } from './helpers/rate-limit-ip'
import {
  createPasswordUser,
  createValidResetToken,
  getUserPasswordHash,
  deleteUserByEmail,
  clearRateLimitKey,
} from './helpers/db'

const user = getTestUser('forgotpw')

// 本檔走 UI 表單觸發 POST /api/auth/forgot-password（rl:forgot:ip，5/15m——全專案最緊的窗口）。
// 唯一 IP identity 讓本檔不與其他 spec／其他 worker 共用該視窗（見 helpers/rate-limit-ip.ts）。
test.use({ extraHTTPHeaders: forwardedHeaders(uniqueTestIp()) })

// 表單送出的兩個 email 都是固定值，而 rl:forgot:email 的 quota 只有 3/60m 且跨執行累積：
// 短時間內反覆重跑整套（開發期常見）會在第二、三輪耗盡額度而 429。IP 維度已由上方唯一 XFF
// 隔離，email 維度則於此清掉自己的 sliding window（比照 email-verification.spec.ts 既有作法）。
const ENUMERATION_PROBE_EMAIL = 'nonexistent@example.com'

test.beforeAll(async () => {
  await createPasswordUser(user.email, user.username, user.password)
  await clearRateLimitKey('rl:forgot:email', user.email.toLowerCase())
  await clearRateLimitKey('rl:forgot:email', ENUMERATION_PROBE_EMAIL)
})

test.afterAll(async () => {
  await deleteUserByEmail(user.email)
})

test.describe('忘記密碼頁面', () => {
  test('未登入可正常訪問 /forgot-password', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByRole('heading', { name: '忘記密碼' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByRole('button', { name: '送出重設連結' })).toBeVisible()
  })

  test('已登入訪問 /forgot-password → redirect 至 /cards', async ({ page }) => {
    // The (auth) layout redirects any logged-in user to /cards.
    await loginAs(page, user)
    await page.goto('/forgot-password')
    await page.waitForURL('**/cards**')
    expect(page.url()).toContain('/cards')
  })

  test('提交任意 email 後顯示統一成功訊息（防 enumeration）', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByLabel('Email').fill(ENUMERATION_PROBE_EMAIL)
    await page.getByRole('button', { name: '送出重設連結' }).click()
    await expect(page.getByTestId('forgot-password-success-alert')).toBeVisible()
    await expect(page.getByTestId('forgot-password-success-alert')).toContainText('若此 email 有帳號')
  })

  test('提交有效帳號 email 後同樣顯示統一成功訊息', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByLabel('Email').fill(user.email)
    await page.getByRole('button', { name: '送出重設連結' }).click()
    await expect(page.getByTestId('forgot-password-success-alert')).toBeVisible()
  })
})

test.describe('重設密碼頁面 — token 流程', () => {
  test('已登入訪問 /reset-password → redirect 至 /cards', async ({ page }) => {
    // The (auth) layout redirects any logged-in user to /cards.
    await loginAs(page, user)
    await page.goto('/reset-password')
    await page.waitForURL('**/cards**')
    expect(page.url()).toContain('/cards')
  })

  test('無 token 參數 → 顯示「連結無效」錯誤', async ({ page }) => {
    await page.goto('/reset-password')
    await expect(page.getByTestId('reset-invalid-alert')).toBeVisible()
    await expect(page.getByRole('link', { name: '重新申請重設連結' })).toBeVisible()
  })

  test('有效 token → 顯示重設密碼表單', async () => {
    const token = await createValidResetToken(user.email)
    // 測試見下面整合測試
    expect(token).toBeTruthy()
    expect(token).toContain('.')
  })

  test('完整流程：有效 token → 重設密碼 → 導回 /login 顯示成功訊息', async ({ page }) => {
    const token = await createValidResetToken(user.email)
    const oldHash = await getUserPasswordHash(user.email)

    await page.goto(`/reset-password?token=${encodeURIComponent(token)}`)
    await expect(page.getByRole('heading', { name: '設定新密碼' })).toBeVisible()

    const newPassword = 'NewPassword456!'
    await page.getByLabel('新密碼').fill(newPassword)
    await page.getByLabel('確認密碼').fill(newPassword)
    await page.getByRole('button', { name: '設定新密碼' }).click()

    await page.waitForURL('**/login**')
    expect(page.url()).toContain('reset=success')
    await expect(page.getByTestId('password-reset-alert')).toBeVisible()
    await expect(page.getByTestId('password-reset-alert')).toContainText('密碼已重設')

    const newHash = await getUserPasswordHash(user.email)
    expect(newHash).not.toBe(oldHash)

    // 恢復原密碼以讓後續測試可用
    await createPasswordUser(user.email, user.username, user.password)
    // (upsert update: {} 不改 hash，需直接更新)
    const bcrypt = await import('bcryptjs')
    const { prisma } = await import('../src/lib/prisma')
    const restored = await bcrypt.default.hash(user.password, 12)
    await prisma.user.update({ where: { email: user.email }, data: { passwordHash: restored } })
  })

  test('已使用的 token → 顯示「連結無效或已被使用」', async ({ page }) => {
    const token = await createValidResetToken(user.email)

    // 先使用一次
    await page.goto(`/reset-password?token=${encodeURIComponent(token)}`)
    await page.getByLabel('新密碼').fill('FirstReset123!')
    await page.getByLabel('確認密碼').fill('FirstReset123!')
    await page.getByRole('button', { name: '設定新密碼' }).click()
    await page.waitForURL('**/login**')

    // 再用同一 token
    await page.goto(`/reset-password?token=${encodeURIComponent(token)}`)
    await page.getByLabel('新密碼').fill('SecondReset456!')
    await page.getByLabel('確認密碼').fill('SecondReset456!')
    await page.getByRole('button', { name: '設定新密碼' }).click()
    await expect(page.getByTestId('reset-error-alert')).toContainText('無效或已被使用')
  })

  test('密碼長度不足 → 顯示錯誤（純前端驗證）', async ({ page }) => {
    const token = await createValidResetToken(user.email)

    await page.goto(`/reset-password?token=${encodeURIComponent(token)}`)
    await page.getByLabel('新密碼').fill('short')
    await page.getByLabel('確認密碼').fill('short')
    await page.getByRole('button', { name: '設定新密碼' }).click()
    // 純前端驗證錯誤 inline 顯示於新密碼欄位（非表單級 reset-error-alert）
    await expect(page.getByText('密碼至少需要 8 個字元')).toBeVisible()
  })

  test('兩次密碼不一致 → 顯示錯誤（純前端驗證）', async ({ page }) => {
    const token = await createValidResetToken(user.email)

    await page.goto(`/reset-password?token=${encodeURIComponent(token)}`)
    await page.getByLabel('新密碼').fill('Password123!')
    await page.getByLabel('確認密碼').fill('Different456!')
    await page.getByRole('button', { name: '設定新密碼' }).click()
    // 不一致錯誤 inline 顯示於確認密碼欄位（非表單級 reset-error-alert）
    await expect(page.getByText('兩次輸入的密碼不一致')).toBeVisible()
  })
})

test.describe('登入頁面 — 忘記密碼連結', () => {
  test('登入頁有「忘記密碼？」連結', async ({ page }) => {
    await page.goto('/login')
    const link = page.getByRole('link', { name: '忘記密碼？' })
    await expect(link).toBeVisible()
    await link.click()
    await page.waitForURL('**/forgot-password**')
  })
})
