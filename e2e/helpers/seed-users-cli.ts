import { seedTestUsers } from './seed-users'

/**
 * 手動預種 E2E 帳號（不跑測試）：`pnpm test:e2e:seed`。
 * 獨立於 playwright（不被 testMatch/globalSetup import），故不受其 ESM loader 限制。
 */
seedTestUsers()
  .then((n) => {
    console.log(`[e2e] seeded ${n} test users`)
    process.exit(0)
  })
  .catch((err) => {
    console.error('[e2e] seed users failed:', err)
    process.exit(1)
  })
