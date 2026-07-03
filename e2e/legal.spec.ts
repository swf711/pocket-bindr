import { test, expect } from '@playwright/test'

test.describe('法律文件頁（訪客瀏覽，無 DB 寫入）', () => {
  test('未登入訪客可直接開啟 /terms', async ({ page }) => {
    await page.goto('/terms')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { level: 1, name: '服務條款' })).toBeVisible()
  })

  test('未登入訪客可直接開啟 /privacy', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { level: 1, name: '隱私權政策' })).toBeVisible()
  })

  test('footer 連結可從 /cards 導航至 /privacy', async ({ page }) => {
    await page.goto('/cards')
    await page.getByTestId('site-footer').getByRole('link', { name: '隱私權政策' }).click()
    await expect(page).toHaveURL(/\/privacy/)
    await expect(page.getByRole('heading', { level: 1, name: '隱私權政策' })).toBeVisible()
  })

  test('EN locale：/terms 顯示英文內容與 governing notice', async ({ page, context }) => {
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', url: 'http://localhost:3000' },
    ])
    await page.goto('/terms')
    await expect(page.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeVisible()
    await expect(page.getByText(/Traditional Chinese version shall prevail/)).toBeVisible()
  })

  test('zh-TW locale：/terms 不顯示 governing notice', async ({ page }) => {
    await page.goto('/terms')
    await expect(page.getByRole('heading', { level: 1, name: '服務條款' })).toBeVisible()
    await expect(page.getByText(/繁體中文版為準/)).toHaveCount(0)
  })

  test('/b/[token] 公開分享頁不受影響（無效 token 仍走既有 404）', async ({ page }) => {
    await page.goto('/b/nonexistent-token-legal-spec')
    await expect(page.getByText('找不到卡冊')).toBeVisible()
  })
})
