import { Page } from '@playwright/test'

export const TEST_USER = {
  email: 'e2e@tcgbinder.com',
  username: 'e2euser',
  password: 'E2eTest1234!',
}

/**
 * 登入測試帳號。若帳號不存在則先註冊。
 * 在 test.beforeEach 中呼叫。
 */
export async function loginAsTestUser(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(TEST_USER.email)
  await page.getByLabel('密碼').fill(TEST_USER.password)
  await page.getByRole('button', { name: '登入', exact: true }).click()

  // 等待登入結果：成功則跳轉，失敗則出現錯誤訊息
  const result = await Promise.race([
    page.waitForURL('**/cards', { timeout: 10000 }).then(() => 'success' as const),
    page.getByTestId('login-error').waitFor({ state: 'visible', timeout: 10000 }).then(() => 'error' as const),
  ])

  // 若登入失敗（帳號不存在），改走註冊
  if (result === 'error') {
    await page.goto('/register')
    await page.getByLabel('Email').fill(TEST_USER.email)
    await page.getByLabel('使用者名稱').fill(TEST_USER.username)
    await page.getByLabel('密碼').fill(TEST_USER.password)
    await page.getByRole('button', { name: '註冊', exact: true }).click()
    await page.waitForURL('**/cards')
  }
}
