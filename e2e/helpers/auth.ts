import { Page } from '@playwright/test'
import { encode } from 'next-auth/jwt'
import { createOAuthUser, createPasswordUser } from './db'

// Auth.js v5 default session cookie name on http (no __Secure prefix on localhost).
// `salt` for JWT encode/decode equals the cookie name (see @auth/core).
const SESSION_COOKIE = 'authjs.session-token'

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
    email: `e2e-${specName}@pocketbindr.com`,
    username: `e2e${specName}`,
    password: 'E2eTest1234!',
  }
}

/**
 * 登入指定測試帳號（在 test.beforeEach 中呼叫），結束時停在 /cards（與舊 UI 流程行為一致）。
 *
 * 預設走**快速路徑**：app 採 `session: { strategy: 'jwt' }`，session 即為簽章 cookie，
 * 故在 DB 確保帳號存在（createPasswordUser upsert）後直接鑄同一顆 JWT cookie 注入，
 * 繞過整段 UI 表單登入，把每次 ~2-3s 的 round-trip 降為即時（見 TECH_DEBT「storageState」項）。
 * 手法與 loginAsOAuthUser 相同，僅帳號來源不同（credentials 帳號需 passwordHash）。
 *
 * `opts.viaUi = true` 走原本的 UI 表單登入（帳號不存在則改註冊），供需要驗證登入 UI 的呼叫點使用。
 */
export async function loginAs(page: Page, user: TestUser, opts: { viaUi?: boolean } = {}): Promise<void> {
  if (!opts.viaUi) {
    // 確保帳號存在並取得 userId；createPasswordUser 為冪等 upsert。
    const { userId } = await createPasswordUser(user.email, user.username, user.password)
    const secret = process.env.AUTH_SECRET
    if (!secret) throw new Error('AUTH_SECRET is required to mint E2E session JWT')
    const token = await encode({
      token: { sub: userId, name: user.username },
      secret,
      salt: SESSION_COOKIE,
    })
    await page.context().addCookies([
      {
        name: SESSION_COOKIE,
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ])
    // 停在 /cards，與 UI 登入流程的 post-condition 一致（cookie 已就緒，不會被導回 /login）。
    await page.goto('/cards')
    return
  }

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

/**
 * 以 OAuth-only 身份登入（無 email+password）。
 * 直接在 DB 建立 User + Account + Session，再將 sessionToken 注入 cookie，
 * 繞過無法在 E2E 模擬的 OAuth provider 流程。
 * 適用於驗證「唯一登入方式防鎖死」等需要 OAuth-only 用戶狀態的情境。
 */
export async function loginAsOAuthUser(
  page: Page,
  email: string,
  username: string,
  provider: 'google' | 'discord',
  providerAccountId: string,
): Promise<void> {
  const { userId } = await createOAuthUser(email, username, provider, providerAccountId)
  // App uses `session: { strategy: 'jwt' }`; auth() decodes a signed JWE cookie,
  // not a DB session row. Mint the same token the jwt callback would produce.
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is required to mint E2E session JWT')
  const token = await encode({
    token: { sub: userId, name: username },
    secret,
    salt: SESSION_COOKIE,
  })
  await page.goto('/')
  await page.context().addCookies([
    {
      name: SESSION_COOKIE,
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
}

// ---- 舊 API（保留為 wrapper，未遷移的呼叫點繼續可用）----

export const TEST_USER: TestUser = {
  email: 'e2e@pocketbindr.com',
  username: 'e2euser',
  password: 'E2eTest1234!',
}

/**
 * @deprecated 改用 getTestUser(specName) + loginAs(page, user)，每 spec 獨立帳號。
 */
export async function loginAsTestUser(page: Page) {
  await loginAs(page, TEST_USER)
}
