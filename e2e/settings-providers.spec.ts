// Requires running server and test database
import { test, expect } from './helpers/test'
import { getTestUser, loginAs, loginAsOAuthUser } from './helpers/auth'
import { clearUserPassword, deleteUserByEmail, clearRateLimitKey, getUserIdIfExists } from './helpers/db'
import { uniqueTestIp, forwardedHeaders } from './helpers/rate-limit-ip'

// 設定密碼（rl:pw-set:ip）與主動連結 OAuth（rl:link:ip）各 10/60m。
// 唯一 IP identity 見 helpers/rate-limit-ip.ts。
test.use({ extraHTTPHeaders: forwardedHeaders(uniqueTestIp()) })

const USER = getTestUser('settingsprov')

test('settings 頁顯示 Google / Discord provider 區塊（email+password 用戶 = 未綁定）', async ({ page }) => {
  await loginAs(page, USER)
  await page.goto('/settings')
  await page.waitForURL('/settings')
  await expect(page.getByTestId('google-link-btn')).toBeVisible()
  await expect(page.getByTestId('discord-link-btn')).toBeVisible()
})

test('未綁定 provider 不再顯示純文字「未綁定」', async ({ page }) => {
  await loginAs(page, USER)
  await page.goto('/settings')
  await page.waitForURL('/settings')
  await expect(page.getByTestId('google-not-linked')).not.toBeAttached()
  await expect(page.getByTestId('discord-not-linked')).not.toBeAttached()
})

test('點擊連結按鈕觸發 initiate POST，進入 loading 狀態', async ({ page }) => {
  await loginAs(page, USER)
  await page.goto('/settings')
  await page.waitForURL('/settings')

  // 延遲 initiate 回應：handleLink 先同步 setLinkingProvider（按鈕立即 disabled）才 await 此 fetch，
  // 故在 fetch pending 期間按鈕穩定維持 disabled，可在此視窗內斷言；待回應 resolve 後才
  // window.location.href 導離。如此完全避開「disabled 態」與「導向」的競態（原測試 fetch 即時 resolve
  // 致導向幾乎與 click 同時發生 → 按鈕被銷毀 → flaky）。
  await page.route('/api/auth/link/google/initiate', async (route) => {
    await new Promise((r) => setTimeout(r, 1500))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ authUrl: 'https://accounts.google.com/mock-auth-url' }),
    })
  })

  await page.getByTestId('google-link-btn').click()
  // 按鈕進入 disabled loading 狀態（fetch pending 期間）
  await expect(page.getByTestId('google-link-btn')).toBeDisabled()
})

test('/settings?link_success=google 顯示成功 toast 並清除 URL', async ({ page }) => {
  await loginAs(page, USER)
  await page.goto('/settings?link_success=google')
  await page.waitForURL('/settings')
  await expect(page.getByText('已成功連結 Google 帳號')).toBeVisible()
  expect(page.url()).not.toContain('link_success')
})

test('/settings?link_success=discord 顯示 Discord 成功 toast', async ({ page }) => {
  await loginAs(page, USER)
  await page.goto('/settings?link_success=discord')
  await page.waitForURL('/settings')
  await expect(page.getByText('已成功連結 Discord 帳號')).toBeVisible()
})

test('/settings?link_error=PROVIDER_ACCOUNT_TAKEN 顯示錯誤 toast 並清除 URL', async ({ page }) => {
  await loginAs(page, USER)
  await page.goto('/settings?link_error=PROVIDER_ACCOUNT_TAKEN')
  await page.waitForURL('/settings')
  await expect(page.getByText('此社群帳號已被其他使用者使用')).toBeVisible()
  expect(page.url()).not.toContain('link_error')
})

test('/settings?link_error=INVALID_STATE 顯示錯誤 toast', async ({ page }) => {
  await loginAs(page, USER)
  await page.goto('/settings?link_error=INVALID_STATE')
  await page.waitForURL('/settings')
  await expect(page.getByText('連結請求無效或已過期，請重試')).toBeVisible()
})

test('/settings?link_error=OAUTH_FAILED 顯示錯誤 toast', async ({ page }) => {
  await loginAs(page, USER)
  await page.goto('/settings?link_error=OAUTH_FAILED')
  await page.waitForURL('/settings')
  await expect(page.getByText('社群帳號驗證失敗，請再試一次')).toBeVisible()
})

test('/settings?link_error=ALREADY_LINKED 顯示錯誤 toast', async ({ page }) => {
  await loginAs(page, USER)
  await page.goto('/settings?link_error=ALREADY_LINKED')
  await page.waitForURL('/settings')
  await expect(page.getByText('此社群帳號已連結至您的帳號')).toBeVisible()
})

test('initiate 回 409 ALREADY_LINKED → toast 不導離頁面', async ({ page }) => {
  await loginAs(page, USER)
  await page.goto('/settings')
  await page.waitForURL('/settings')

  await page.route('/api/auth/link/google/initiate', (route) =>
    route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'ALREADY_LINKED' }),
    })
  )

  await page.getByTestId('google-link-btn').click()
  await expect(page.getByText('此帳號已連結此社群帳號')).toBeVisible()
  expect(page.url()).toContain('/settings')
})

test('刪除帳號 dialog：未輸入 DELETE 時確認按鈕 disabled', async ({ page }) => {
  await loginAs(page, USER)
  await page.goto('/settings')
  await page.waitForURL('/settings')
  await page.getByRole('button', { name: '刪除帳號' }).click()
  await expect(page.getByTestId('confirm-delete-btn')).toBeDisabled()
})

test('刪除帳號 dialog：輸入 DELETE 後確認按鈕 enabled（不點擊確認）', async ({ page }) => {
  await loginAs(page, USER)
  await page.goto('/settings')
  await page.waitForURL('/settings')
  await page.getByRole('button', { name: '刪除帳號' }).click()
  await page.getByTestId('delete-confirm-input').fill('DELETE')
  await expect(page.getByTestId('confirm-delete-btn')).toBeEnabled()
  // 確保不點擊確認，不實際刪除帳號
})

// ---- 解綁防鎖死（OAuth-only user）----

const OAUTH_ONLY_EMAIL = 'e2e-oauthonly@pocketbindr.com'
const OAUTH_ONLY_USERNAME = 'e2eoauthonly'
const OAUTH_ONLY_PROVIDER_ID = 'mock-e2e-provider-001'

test.describe('解綁防鎖死', () => {
  test.afterAll(async () => {
    await deleteUserByEmail(OAUTH_ONLY_EMAIL)
  })

  test('OAuth-only 用戶：唯一登入方式，Google 解綁按鈕 disabled', async ({ page }) => {
    await loginAsOAuthUser(page, OAUTH_ONLY_EMAIL, OAUTH_ONLY_USERNAME, 'google', OAUTH_ONLY_PROVIDER_ID)
    await page.goto('/settings')
    await page.waitForURL('/settings')
    await expect(page.getByTestId('google-unlink-btn')).toBeDisabled()
  })

  test('OAuth-only 用戶：唯一登入方式，解綁按鈕有防鎖死 tooltip', async ({ page }) => {
    await loginAsOAuthUser(page, OAUTH_ONLY_EMAIL, OAUTH_ONLY_USERNAME, 'google', OAUTH_ONLY_PROVIDER_ID)
    await page.goto('/settings')
    await page.waitForURL('/settings')
    await expect(page.getByTestId('google-unlink-btn')).toHaveAttribute('title', '這是您目前唯一的登入方式，無法解綁')
  })
})

// ---- 純 OAuth 使用者設定密碼 ----

const SET_PW_EMAIL = 'e2e-setpw@pocketbindr.com'
const SET_PW_USERNAME = 'e2esetpw'
const SET_PW_PROVIDER_ID = 'mock-e2e-setpw-001'

test.describe('純 OAuth 使用者設定密碼', () => {
  test.beforeEach(async () => {
    // 還原為純 OAuth 狀態（前一測試可能已設過密碼）
    await clearUserPassword(SET_PW_EMAIL)

    // rl:pw-set:user 只有 3/60m，而本 describe 每輪就送出 3 次——毫無餘裕，任何 retry 都會 429。
    // 帳號在 afterAll 會被刪、下輪 userId 通常是新的，但同輪內必須清，否則第三個 case 卡在上限。
    const userId = await getUserIdIfExists(SET_PW_EMAIL)
    if (userId) await clearRateLimitKey('rl:pw-set:user', userId)
  })

  test.afterAll(async () => {
    await deleteUserByEmail(SET_PW_EMAIL)
  })

  test('純 OAuth 用戶 settings 頁顯示「設定密碼」卡、不顯示「修改密碼」卡', async ({ page }) => {
    await loginAsOAuthUser(page, SET_PW_EMAIL, SET_PW_USERNAME, 'google', SET_PW_PROVIDER_ID)
    await page.goto('/settings')
    await page.waitForURL('/settings')
    await expect(page.getByTestId('set-password-input')).toBeVisible()
    // 純 OAuth（無密碼）不應顯示「修改密碼」卡（其 current-password 欄位）
    await expect(page.getByTestId('current-password-input')).not.toBeVisible()
  })

  test('新密碼少於 8 字元顯示錯誤', async ({ page }) => {
    await loginAsOAuthUser(page, SET_PW_EMAIL, SET_PW_USERNAME, 'google', SET_PW_PROVIDER_ID)
    await page.goto('/settings')
    await page.waitForURL('/settings')
    await page.getByTestId('set-password-input').fill('short')
    await page.getByTestId('set-password-confirm-input').fill('short')
    await page.getByTestId('save-set-password-btn').click()
    await expect(page.getByTestId('set-password-error')).toBeVisible()
  })

  test('兩次密碼不一致顯示錯誤', async ({ page }) => {
    await loginAsOAuthUser(page, SET_PW_EMAIL, SET_PW_USERNAME, 'google', SET_PW_PROVIDER_ID)
    await page.goto('/settings')
    await page.waitForURL('/settings')
    await page.getByTestId('set-password-input').fill('NewPassword123!')
    await page.getByTestId('set-password-confirm-input').fill('Different123!')
    await page.getByTestId('save-set-password-btn').click()
    await expect(page.getByTestId('set-password-error')).toHaveText('兩次輸入的密碼不一致')
  })

  test('成功設定密碼顯示 toast、卡片切回「修改密碼」', async ({ page }) => {
    await loginAsOAuthUser(page, SET_PW_EMAIL, SET_PW_USERNAME, 'google', SET_PW_PROVIDER_ID)
    await page.goto('/settings')
    await page.waitForURL('/settings')
    await page.getByTestId('set-password-input').fill('NewPassword123!')
    await page.getByTestId('set-password-confirm-input').fill('NewPassword123!')
    await page.getByTestId('save-set-password-btn').click()
    await expect(page.getByText('密碼已設定')).toBeVisible()
    // router.refresh 後 hasPassword=true，卡片切回「修改密碼」（出現 current-password 欄位）
    await expect(page.getByTestId('current-password-input')).toBeVisible()
    await expect(page.getByTestId('set-password-input')).not.toBeVisible()
  })
})

// ---- 帳號刪除完整流程 ----

const DELETE_USER = getTestUser('settingsdel')

test.describe('帳號刪除完整流程', () => {
  // 不需 afterAll：測試本身刪除帳號；下次 E2E run 由 loginAs 自動重建

  test('刪除帳號後導向 /login?account_deleted=true 並顯示刪除 alert', async ({ page }) => {
    await loginAs(page, DELETE_USER)
    await page.goto('/settings')
    await page.waitForURL('/settings')

    await page.getByRole('button', { name: '刪除帳號' }).click()
    await page.getByTestId('delete-confirm-input').fill('DELETE')
    await page.getByTestId('confirm-delete-btn').click()

    await page.waitForURL(/\/login/)
    expect(page.url()).toContain('account_deleted=true')
    await expect(page.getByTestId('account-deleted-alert')).toBeVisible()
  })
})
