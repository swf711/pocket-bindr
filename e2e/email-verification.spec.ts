import { test, expect } from './helpers/test'
import { getTestUser, loginAs } from './helpers/auth'
import { uniqueTestIp, forwardedHeaders } from './helpers/rate-limit-ip'
import {
  createUnverifiedPasswordUser,
  createValidSignupVerifyToken,
  getUserEmailVerifiedAt,
  deleteUserByEmail,
  clearRateLimitKey,
} from './helpers/db'

const user = getTestUser('emailverify')

// `getTestUser('emailverify')` 這個帳號會被 globalSetup（seedTestUsers，掃描全 spec
// getTestUser 字面值）預種為「已驗證」狀態；用它測試「全新註冊」流程會撞 EMAIL_TAKEN。
// 故「全新註冊」情境改用不經 getTestUser 的動態 email（同 auth.spec.ts 模式），
// 其餘情境（登入被擋/驗證連結/重寄）沿用 user，測試內會顯式 createUnverifiedPasswordUser
// 覆寫為所需狀態，不受預種影響。
const freshEmail = `e2e-emailverify-fresh-${Date.now()}@pocketbindr.com`
// USERNAME_RE 限 3-20 字元（src/lib/schemas/user.ts），需保持短。
const freshUsername = `e2ev${Date.now().toString(36)}`

// 本檔連續呼叫多次 /api/auth/register / verify-signup / resend-verification，
// 皆以來源 IP 計入限流；用每輪唯一 IP 讓本檔不受同機重複跑（本機除錯）或其他 spec
// 共用 127.0.0.1 的限流視窗污染（詳見 helpers/rate-limit-ip.ts）。
const TEST_IP = uniqueTestIp()
test.use({ extraHTTPHeaders: forwardedHeaders(TEST_IP) })

// resendVerificationEmailLimiter 以 email 為維度（3/hr），與上面的 IP 隔離無關；
// user.email 是固定的 getTestUser 帳號，重複跑本檔會累積用掉額度，需另外清空。
test.beforeAll(async () => {
  await clearRateLimitKey('rl:resend-verify:email', user.email.toLowerCase())
})

test.afterAll(async () => {
  await deleteUserByEmail(user.email)
  await deleteUserByEmail(freshEmail)
})

test.describe('註冊 → 強制 email 驗證流程', () => {
  test('註冊成功後顯示請查收信箱，不建立可用 session', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    await page.getByLabel('Email').fill(freshEmail)
    await page.getByLabel('使用者名稱').fill(freshUsername)
    await page.getByLabel('密碼', { exact: true }).fill(user.password)
    await page.getByLabel('確認密碼').fill(user.password)
    await page.getByRole('button', { name: '註冊' }).click()

    await expect(page.getByRole('heading', { name: '請查收信箱' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(freshEmail)).toBeVisible()

    // 未建立可用 session：訪問受保護路由應被導回 /login
    await page.goto('/binders')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})

test.describe('未驗證帳號登入被擋', () => {
  test('未驗證帳號嘗試登入 → 顯示提示 + 重寄入口', async ({ page }) => {
    await createUnverifiedPasswordUser(user.email, user.username, user.password)

    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('密碼', { exact: true }).fill(user.password)
    await page.getByRole('button', { name: '登入', exact: true }).click()

    await expect(page.getByTestId('email-not-verified-alert')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: '重寄驗證信' })).toBeVisible()
    expect(page.url()).toContain('/login')
  })
})

test.describe('驗證連結流程', () => {
  test('有效 token（未登入態）→ 驗證成功 → 可導向登入', async ({ page }) => {
    const { userId } = await createUnverifiedPasswordUser(user.email, user.username, user.password)
    const token = createValidSignupVerifyToken(userId, user.email)

    await page.goto(`/verify-signup?token=${encodeURIComponent(token)}`)
    await expect(page.getByRole('heading', { name: 'Email 已驗證' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('link', { name: '前往登入' })).toBeVisible()

    const verifiedAt = await getUserEmailVerifiedAt(user.email)
    expect(verifiedAt).not.toBeNull()

    // 驗證後可正常登入
    await page.goto('/login')
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('密碼', { exact: true }).fill(user.password)
    await page.getByRole('button', { name: '登入', exact: true }).click()
    await page.waitForURL('**/cards**', { timeout: 10000 })
    expect(page.url()).toContain('/cards')
  })

  test('偽造/竄改 token（含過期案例的錯誤處理路徑，TOKEN_EXPIRED 的精確覆蓋見單元測試）→ 顯示錯誤 + 重寄出口（非返回註冊死路）', async ({ page }) => {
    const invalidToken = `${Buffer.from(JSON.stringify({ userId: 'x', email: user.email, purpose: 'verify-signup', exp: Date.now() - 1000 })).toString('base64url')}.invalidsignature`

    await page.goto(`/verify-signup?token=${encodeURIComponent(invalidToken)}`)
    await expect(page.getByTestId('verify-signup-error-alert')).toBeVisible({ timeout: 10000 })
    // 舊版只有「返回註冊」，但同 email 重新註冊必得 EMAIL_TAKEN，是死路。
    // 改為比照 reset-password 失效卡：導向獨立的重寄申請頁。
    await expect(page.getByRole('link', { name: '重寄驗證信' })).toBeVisible()
    await expect(page.getByRole('link', { name: '返回註冊' })).toHaveCount(0)
  })

  test('失效卡的「重寄驗證信」導向 /resend-verification', async ({ page }) => {
    await page.goto('/verify-signup')
    await expect(page.getByTestId('verify-signup-error-alert')).toBeVisible({ timeout: 10000 })

    await page.getByRole('link', { name: '重寄驗證信' }).click()
    await expect(page).toHaveURL(/\/resend-verification$/)
    await expect(page.getByRole('heading', { name: '重寄驗證信' })).toBeVisible()
  })

  test('無 token 參數 → 顯示無效連結錯誤', async ({ page }) => {
    await page.goto('/verify-signup')
    await expect(page.getByTestId('verify-signup-error-alert')).toBeVisible()
  })

  test('重放已使用的 token → 顯示已驗證訊息', async ({ page }) => {
    const { userId } = await createUnverifiedPasswordUser(user.email, user.username, user.password)
    const token = createValidSignupVerifyToken(userId, user.email)

    await page.goto(`/verify-signup?token=${encodeURIComponent(token)}`)
    await expect(page.getByRole('heading', { name: 'Email 已驗證' })).toBeVisible({ timeout: 10000 })

    // 同一 token 再次訪問 → single-use no-op（D5），顯示「已驗證」而非錯誤
    await page.goto(`/verify-signup?token=${encodeURIComponent(token)}`)
    await expect(page.getByRole('heading', { name: '已驗證' })).toBeVisible({ timeout: 10000 })
  })
})

test.describe('重寄驗證信申請頁 /resend-verification', () => {
  // 比照 forgot-password：獨立頁 + RHF/zod 表單 + 防 enumeration 統一成功訊息。
  test('未登入可正常訪問，顯示表單', async ({ page }) => {
    await page.goto('/resend-verification')
    await expect(page.getByRole('heading', { name: '重寄驗證信' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByRole('button', { name: '送出驗證信' })).toBeVisible()
  })

  test('提交任意 email 顯示統一成功訊息（防 enumeration）', async ({ page }) => {
    // 一次性 email，避免佔用 user.email 的 resend 額度（3/hr per email）。
    await page.goto('/resend-verification')
    await page.getByLabel('Email').fill(`e2e-resendpage-${Date.now()}@pocketbindr.com`)
    await page.getByRole('button', { name: '送出驗證信' }).click()
    await expect(page.getByTestId('resend-verification-success-alert')).toBeVisible({ timeout: 10000 })
  })

  test('email 格式錯誤 → inline 欄位錯誤，不送出（純前端 zod 驗證）', async ({ page }) => {
    await page.goto('/resend-verification')
    await page.getByLabel('Email').fill('not-an-email')
    await page.getByRole('button', { name: '送出驗證信' }).click()
    await expect(page.getByTestId('resend-verification-success-alert')).toHaveCount(0)
  })

  test('已登入訪問 → (auth) layout redirect 至 /cards', async ({ page }) => {
    await createUnverifiedPasswordUser(user.email, user.username, user.password)
    await loginAs(page, user)
    await page.goto('/resend-verification')
    await page.waitForURL('**/cards**')
    expect(page.url()).toContain('/cards')
  })
})

test.describe('重寄驗證信', () => {
  test('未驗證帳號登入被擋後點擊重寄 → 顯示已寄出', async ({ page }) => {
    await createUnverifiedPasswordUser(user.email, user.username, user.password)

    await page.goto('/login')
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('密碼', { exact: true }).fill(user.password)
    await page.getByRole('button', { name: '登入', exact: true }).click()
    await expect(page.getByTestId('email-not-verified-alert')).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: '重寄驗證信' }).click()
    await expect(page.getByRole('button', { name: '已寄出' })).toBeVisible({ timeout: 10000 })
  })
})
