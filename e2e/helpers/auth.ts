import { Page } from '@playwright/test'

export interface TestUser {
  email: string
  username: string
  password: string
}

/**
 * 為單一 spec 建立獨立測試帳號（每 spec 一個，避免平行 worker race）。
 * specName 只允許 [a-z0-9]。
 */
export function getTestUser(specName: string): TestUser {
  if (!/^[a-z0-9]+$/.test(specName)) {
    throw new Error(`getTestUser: specName 只允許 [a-z0-9]，收到 "${specName}"`)
  }
  return {
    email: `e2e-${specName}@tcgbinder.com`,
    username: `e2e${specName}`,
    password: 'E2eTest1234!',
  }
}

/**
 * 登入指定測試帳號。若帳號不存在則先註冊。
 * 在 test.beforeEach 中呼叫。
 */
export async function loginAs(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('密碼', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: '登入', exact: true }).click()

  // 等待登入結果：成功則跳轉，失敗則出現錯誤訊息
  const result = await Promise.race([
    page.waitForURL('**/cards', { timeout: 10000 }).then(() => 'success' as const),
    page.getByTestId('login-error').waitFor({ state: 'visible', timeout: 10000 }).then(() => 'error' as const),
  ])

  // 若登入失敗（帳號不存在），改走註冊
  if (result === 'error') {
    await page.goto('/register')
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('使用者名稱').fill(user.username)
    await page.getByLabel('密碼', { exact: true }).fill(user.password)
    await page.getByLabel('確認密碼').fill(user.password)
    await page.getByRole('button', { name: '註冊', exact: true }).click()
    await page.waitForURL('**/cards')
  }
}

// ---- 舊 API（保留為 wrapper，未遷移的呼叫點繼續可用）----

export const TEST_USER: TestUser = {
  email: 'e2e@tcgbinder.com',
  username: 'e2euser',
  password: 'E2eTest1234!',
}

/**
 * @deprecated 改用 getTestUser(specName) + loginAs(page, user)，每 spec 獨立帳號。
 */
export async function loginAsTestUser(page: Page) {
  await loginAs(page, TEST_USER)
}
