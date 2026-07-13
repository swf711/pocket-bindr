// Requires running server, test database, and real Supabase Storage credentials
// (writes to the `avatars` bucket + User.image — see docs/TECH_DEBT.md if CI lacks Supabase).
import { test, expect } from './helpers/test'
import { getTestUser, loginAs } from './helpers/auth'
import { clearUserAvatar } from './helpers/db'

const USER = getTestUser('avatar')

// Minimal valid 1x1 red PNG, base64-encoded.
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

test.describe('頭像上傳', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USER)
    await page.goto('/settings')
    await page.waitForURL('/settings')
  })

  test.afterEach(async () => {
    await clearUserAvatar(USER.email)
  })

  test('上傳頭像後顯示，移除後回到 fallback', async ({ page }) => {
    const fallbackInitial = USER.username.charAt(0).toUpperCase()

    await page.setInputFiles('[data-testid="avatar-file-input"]', {
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: Buffer.from(TINY_PNG_BASE64, 'base64'),
    })

    await expect(page.getByText('頭像已更新')).toBeVisible()
    await expect(page.locator('[data-slot="avatar-image"]').first()).toBeVisible()

    // Header 右上角頭像應即時同步（router.refresh() 觸發 Server Component 重渲染），不需重新導航
    await expect(
      page.locator('[data-testid="user-menu-trigger"] [data-slot="avatar-image"]')
    ).toBeVisible()

    await page.getByRole('button', { name: '移除' }).click()
    await expect(page.getByText('頭像已移除')).toBeVisible()
    await expect(page.locator('[data-slot="avatar-image"]')).toHaveCount(0)
    await expect(page.getByText(fallbackInitial, { exact: true }).first()).toBeVisible()
    await expect(
      page.locator('[data-testid="user-menu-trigger"] [data-slot="avatar-image"]')
    ).toHaveCount(0)
  })
})
