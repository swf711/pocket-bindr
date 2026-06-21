import { test, expect } from '@playwright/test'

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
