import { seedTestUsers } from './helpers/seed-users'

/**
 * Playwright globalSetup：測試套件啟動前一次性冪等預種所有 E2E 密碼帳號，
 * 讓 fresh DB / CI 能自舉（不再需 30+ 次註冊撞 register IP 限流）。
 * 僅寫 DB（透過 prisma），不依賴 webServer 就緒。
 */
export default async function globalSetup(): Promise<void> {
  const count = await seedTestUsers()
  console.log(`[e2e] globalSetup: seeded ${count} test users`)
}
