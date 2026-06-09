import { test, expect } from '@playwright/test'

const TEST_EMAIL = `e2e-${Date.now()}@tcgbinder.com`
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

  test('3. Register new account → auto login → redirect to /cards', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('使用者名稱').fill(TEST_USERNAME)
    await page.getByLabel('密碼').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: '註冊' }).click()

    await page.waitForURL('**/cards**', { timeout: 15000 })
    expect(page.url()).toContain('/cards')
  })

  test('4. Sign out → session cleared', async ({ page }) => {
    // First log in
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('密碼').fill(TEST_PASSWORD)
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
    await page.getByLabel('密碼').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: '登入', exact: true }).click()

    await page.waitForURL('**/cards**', { timeout: 10000 })
    expect(page.url()).toContain('/cards')
  })

  test('6. Already logged in → /login redirects to /cards', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('密碼').fill(TEST_PASSWORD)
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
    await page.getByLabel('密碼').fill('WrongPassword!')
    await page.getByRole('button', { name: '登入', exact: true }).click()

    await expect(page.getByText('Email 或密碼錯誤')).toBeVisible({ timeout: 10000 })
    expect(page.url()).toContain('/login')
  })

  test('8. Register with taken email shows error', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('使用者名稱').fill('anotherusername')
    await page.getByLabel('密碼').fill('Test1234!')
    await page.getByRole('button', { name: '註冊' }).click()

    await expect(page.getByText('此 Email 已被使用')).toBeVisible({ timeout: 10000 })
  })
})
