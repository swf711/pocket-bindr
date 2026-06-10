import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers/auth'

test.describe('Header 與 Navigation', () => {
  test('未登入顯示登入按鈕，不顯示我的卡冊', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('app-header')).toBeVisible()
    await expect(page.getByTestId('nav-login')).toBeVisible()
    await expect(page.getByTestId('nav-binders')).not.toBeVisible()
  })

  test('登入後顯示使用者選單與我的卡冊', async ({ page }) => {
    await loginAsTestUser(page)
    await expect(page.getByTestId('user-menu-trigger')).toBeVisible()
    await expect(page.getByTestId('nav-binders')).toBeVisible()
    await expect(page.getByTestId('nav-login')).not.toBeVisible()
  })

  test('使用者選單可以登出', async ({ page }) => {
    await loginAsTestUser(page)
    await page.getByTestId('user-menu-trigger').click()
    await page.getByTestId('menu-logout').click()
    await expect(page.getByTestId('nav-login')).toBeVisible()
  })

  test('導覽連結正確跳轉', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('nav-cards').click()
    await expect(page).toHaveURL(/\/cards/)
  })
})
