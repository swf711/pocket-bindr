// Requires running server and test database
import { test, expect } from '@playwright/test'
import { getTestUser, loginAs } from './helpers/auth'

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
