import { config } from 'dotenv'
// 對齊 Next.js / db.ts 的 env 精度：先 .env 再 .env.local（override）。
config({ path: '.env' })
config({ path: '.env.local', override: true })
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { getTestUser, TEST_USER, type TestUser } from './auth'

/**
 * seed 專用 Prisma client：採 scripts/ backfill 對 Supabase pooler 寫入所用、經專案
 * 驗證可靠的建法——**原始 DATABASE_URL**（保留 `pgbouncer` 參數、不 force ssl）。
 * 刻意不用 `src/lib/prisma`：後者 strip `?pgbouncer=true` + force `ssl:{rejectUnauthorized:false}`
 * 的組合，對 pooler :6543 的「寫入」在 standalone / playwright globalSetup context 會偶發
 * 「server does not support SSL connections」（讀取正常、寫入才踩到）。
 */
function makePrisma(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

/**
 * 掃描 e2e/*.spec.ts 內所有 `getTestUser('<name>')` 字面值，作為測試帳號名單的
 * **單一真相**（直接反映 spec 實際用到的帳號，無需另維護清單、零漂移）。
 */
export function collectSpecUsers(): TestUser[] {
  const e2eDir = join(process.cwd(), 'e2e')
  const specFiles = readdirSync(e2eDir).filter((f) => f.endsWith('.spec.ts'))
  const names = new Set<string>()
  for (const file of specFiles) {
    const src = readFileSync(join(e2eDir, file), 'utf8')
    for (const m of src.matchAll(/getTestUser\(\s*['"]([a-z0-9]+)['"]\s*\)/g)) {
      names.add(m[1])
    }
  }
  // 含 deprecated 的共用 TEST_USER（loginAsTestUser 仍可能被未遷移的呼叫點使用）。
  return [TEST_USER, ...[...names].sort().map(getTestUser)]
}

/**
 * 冪等重試：pooler 首次連線偶有 transient 失敗；seed 為冪等 upsert，安全重試，
 * 避免單次 pooler flakiness 讓 globalSetup throw 而 abort 整套 suite。
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 4, delayMs = 600): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)))
    }
  }
  throw lastErr
}

/**
 * 冪等預種所有 E2E 密碼帳號（upsert-on-email，語意同 e2e/helpers/db.ts createPasswordUser）。
 * 供 playwright globalSetup 與 fresh DB / CI bootstrap 使用：一次建立全部帳號，
 * 避免逐 spec 首次登入才 lazy upsert，且完全繞過 register API 的 IP 限流。
 * emailVerified 一律蓋為 now()——強制 email 驗證上線後 verifyCredentials 會擋
 * 未驗證帳號登入（見 CLAUDE.md），這裡預種的帳號語意是「可直接登入」，
 * 需要「未驗證」情境的 spec 應改用 e2e/helpers/db.ts createUnverifiedPasswordUser。
 * 回傳實際處理的帳號數。
 */
export async function seedTestUsers(): Promise<number> {
  const users = collectSpecUsers()
  const prisma = makePrisma()
  try {
    for (const u of users) {
      await withRetry(async () => {
        const passwordHash = await bcrypt.hash(u.password, 12)
        await prisma.user.upsert({
          where: { email: u.email },
          create: { email: u.email, username: u.username, passwordHash, emailVerified: new Date() },
          update: { emailVerified: new Date() },
          select: { id: true },
        })
      })
    }
  } finally {
    await prisma.$disconnect()
  }
  return users.length
}
