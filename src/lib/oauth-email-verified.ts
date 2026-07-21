/**
 * 判定 OAuth provider 是否宣告該帳號的 email 已驗證。
 *
 * ⚠️「有 email」不等於「已驗證 email」——Discord 允許帳號存在未驗證 email，
 * 必讀 provider 自己的旗標，不可因 profile 有 email 就蓋章。
 *
 * 之所以需要這個函式（而非在 provider 的 profile() 內處理）：
 * @auth/core 的 OAuth 建帳號路徑（lib/actions/callback/handle-login.js）
 * 以 `createUser({ ...profile, emailVerified: null })` 無條件覆蓋 profile() 回傳的值，
 * 故真正的蓋章只能在 jwt callback 拿到原始 OAuth profile 時執行（見 src/lib/auth.ts）。
 */
export function resolveProviderEmailVerified(
  provider: string | undefined | null,
  profile: Record<string, unknown> | undefined | null,
): boolean {
  if (!provider || !profile) return false

  switch (provider) {
    // Google OIDC：email_verified 是唯一可信旗標。
    case 'google':
      return profile.email_verified === true
    // Discord /users/@me：verified 表示 email 已完成驗證。
    case 'discord':
      return profile.verified === true
    default:
      return false
  }
}
