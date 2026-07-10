import { test, expect } from '@playwright/test'
import { prisma } from '../src/lib/prisma'

const TEST_EMAIL = `e2e-${Date.now()}@pocketbindr.com`
const TEST_USERNAME = `e2euser${Date.now()}`
const TEST_PASSWORD = 'Test1234!'

test.describe.serial('Auth Flow', () => {
  test('1. /binders redirects to /login when not authenticated', async ({ page }) => {
    await page.goto('/binders')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('2. /cards is accessible without authentication', async ({ page }) => {
    await page.goto('/cards')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/cards')
    expect(page.url()).not.toContain('/login')
  })

  test('3. Register new account → 顯示請查收信箱（強制 email 驗證，不自動登入）', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('使用者名稱').fill(TEST_USERNAME)
    await page.getByLabel('密碼', { exact: true }).fill(TEST_PASSWORD)
    await page.getByLabel('確認密碼').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: '註冊' }).click()

    await expect(page.getByRole('heading', { name: '請查收信箱' })).toBeVisible({ timeout: 15000 })
    expect(page.url()).toContain('/register')

    // 模擬點擊驗證信連結（後續 4-6 測試需要一個已驗證帳號才能走 UI 登入）。
    await prisma.user.update({ where: { email: TEST_EMAIL }, data: { emailVerified: new Date() } })
  })

  test('4. Sign out → session cleared', async ({ page }) => {
    // First log in
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('密碼', { exact: true }).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: '登入', exact: true }).click()
    await page.waitForURL('**/cards**', { timeout: 10000 })

    // Sign out via NextAuth API
    await page.goto('/api/auth/signout')
    await page.waitForLoadState('networkidle')
    // NextAuth shows a confirmation form; submit it
    const csrfButton = page.getByRole('button', { name: /sign out/i })
    if (await csrfButton.isVisible()) {
      await csrfButton.click()
      await page.waitForLoadState('networkidle')
    }

    // After signout, accessing /binders should redirect to /login
    await page.goto('/binders')
    await page.waitForURL('**/login**', { timeout: 10000 })
    expect(page.url()).toContain('/login')
  })

  test('5. Login with existing credentials → redirect to /cards', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('密碼', { exact: true }).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: '登入', exact: true }).click()

    await page.waitForURL('**/cards**', { timeout: 10000 })
    expect(page.url()).toContain('/cards')
  })

  test('6. Already logged in → /login redirects to /cards', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('密碼', { exact: true }).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: '登入', exact: true }).click()
    await page.waitForURL('**/cards**', { timeout: 10000 })

    // Now visit /login again
    await page.goto('/login')
    await page.waitForURL('**/cards**', { timeout: 10000 })
    expect(page.url()).toContain('/cards')
  })

  test('7. Wrong password shows error message', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('密碼', { exact: true }).fill('WrongPassword!')
    await page.getByRole('button', { name: '登入', exact: true }).click()

    await expect(page.getByText('Email 或密碼錯誤')).toBeVisible({ timeout: 10000 })
    expect(page.url()).toContain('/login')
  })

  test('8. Register with taken email shows error', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('使用者名稱').fill('anotherusername')
    await page.getByLabel('密碼', { exact: true }).fill('Test1234!')
    await page.getByLabel('確認密碼').fill('Test1234!')
    await page.getByRole('button', { name: '註冊' }).click()

    await expect(page.getByText('此 Email 已被使用')).toBeVisible({ timeout: 10000 })
  })

  test('9. Register with weak password (<8) shows error and stays on /register', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    await page.getByLabel('Email').fill(`weak-${Date.now()}@pocketbindr.com`)
    await page.getByLabel('使用者名稱').fill(`weak${Date.now()}`)
    await page.getByLabel('密碼', { exact: true }).fill('short')
    await page.getByLabel('確認密碼').fill('short')
    await page.getByRole('button', { name: '註冊' }).click()

    await expect(page.getByText('密碼至少需要 8 個字元')).toBeVisible({ timeout: 10000 })
    expect(page.url()).toContain('/register')
  })

  test('10. Register with mismatched confirm password shows error', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    await page.getByLabel('Email').fill(`mismatch-${Date.now()}@pocketbindr.com`)
    await page.getByLabel('使用者名稱').fill(`mismatch${Date.now()}`)
    await page.getByLabel('密碼', { exact: true }).fill('password123')
    await page.getByLabel('確認密碼').fill('password999')
    await page.getByRole('button', { name: '註冊' }).click()

    await expect(page.getByText('兩次輸入的密碼不一致')).toBeVisible({ timeout: 10000 })
    expect(page.url()).toContain('/register')
  })
})
