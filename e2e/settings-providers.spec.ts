// Requires running server and test database
import { test, expect } from '@playwright/test'
import { getTestUser, loginAs } from './helpers/auth'

const USER = getTestUser('settingsprov')

test('settings 頁顯示 Google / Discord provider 區塊（email+password 用戶 = 未綁定）', async ({ page }) => {
  await loginAs(page, USER)
  await page.goto('/settings')
  await page.waitForURL('/settings')
  await expect(page.getByTestId('google-not-linked')).toBeVisible()
  await expect(page.getByTestId('discord-not-linked')).toBeVisible()
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
