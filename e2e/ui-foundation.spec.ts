import { test, expect } from './helpers/test'
import { getTestUser, loginAs } from './helpers/auth'

const USER = getTestUser('uifoundation')

test.describe('Header 與 Navigation', () => {
  test('未登入顯示登入按鈕，不顯示我的卡冊', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('app-header')).toBeVisible()
    await expect(page.getByTestId('nav-login')).toBeVisible()
    await expect(page.getByTestId('nav-binders')).not.toBeVisible()
  })

  test('登入後顯示使用者選單與我的卡冊', async ({ page }) => {
    await loginAs(page, USER)
    await expect(page.getByTestId('user-menu-trigger')).toBeVisible()
    await expect(page.getByTestId('nav-binders')).toBeVisible()
    await expect(page.getByTestId('nav-login')).not.toBeVisible()
  })

  test('使用者選單可以登出', async ({ page }) => {
    await loginAs(page, USER)
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
