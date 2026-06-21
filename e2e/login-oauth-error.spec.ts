import { test, expect } from '@playwright/test'
import { getTestUser, loginAs } from './helpers/auth'

test('OAuthAccountNotLinked error 顯示 Alert 含正確文案', async ({ page }) => {
  await page.goto('/login?error=OAuthAccountNotLinked')
  await expect(page.getByTestId('oauth-error-alert')).toBeVisible()
  await expect(page.getByText('尚未綁定此社群帳號')).toBeVisible()
})

test('/login 無 error 時不顯示 oauth-error-alert', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByTestId('oauth-error-alert')).not.toBeAttached()
})

test('登入頁顯示 Discord 登入按鈕', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByText('以 Discord 登入')).toBeVisible()
})

test('/login?account_deleted=true 顯示帳號已刪除 Alert', async ({ page }) => {
  await page.goto('/login?account_deleted=true')
  await expect(page.getByTestId('account-deleted-alert')).toBeVisible()
  await expect(page.getByText('帳號已刪除')).toBeVisible()
})

test('帶有 ?error=OAuthAccountNotLinked 時，正確憑證仍可成功登入', async ({ page }) => {
  const user = getTestUser('oautherror')
  // 確保帳號存在
  await loginAs(page, user)
  // 登出
  await page.goto('/api/auth/signout')
  await page.getByRole('button', { name: /sign out/i }).click().catch(() => {})
  // 模擬從 OAuth 錯誤導回的登入頁
  await page.goto('/login?error=OAuthAccountNotLinked')
  await expect(page.getByTestId('oauth-error-alert')).toBeVisible()
  // 輸入正確憑證
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('密碼').fill(user.password)
  await page.getByRole('button', { name: '登入', exact: true }).click()
  // 應成功跳轉，不出現錯誤
  await page.waitForURL('**/cards', { timeout: 10000 })
  await expect(page.getByTestId('login-error')).not.toBeAttached()
})
