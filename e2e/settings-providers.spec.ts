// Requires running server and test database
import { test, expect } from '@playwright/test'
import { getTestUser, loginAs, loginAsOAuthUser } from './helpers/auth'
import { deleteUserByEmail } from './helpers/db'

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

  await page.route('/api/auth/link/google/initiate', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ authUrl: 'https://accounts.google.com/mock-auth-url' }),
    })
  )

  // 攔截外部導向，避免真正跳離
  let navigated = false
  page.on('request', (req) => {
    if (req.url().includes('accounts.google.com')) navigated = true
  })

  await page.getByTestId('google-link-btn').click()
  // 按鈕進入 disabled loading 狀態
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

const OAUTH_ONLY_EMAIL = 'e2e-oauthonly@tcgbinder.com'
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
