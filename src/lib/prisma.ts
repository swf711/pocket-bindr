import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool, type PoolConfig } from 'pg'
import { attachDatabasePool } from '@vercel/functions'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Pool 參數：Supabase pooler（transaction mode）前的每實例連線上限與閒置回收。
 * 未設時全走 pg 預設（無連線逾時、閒置 10s），Fluid 實例暫停再喚醒後容易拿到半死連線。
 */
export const POOL_OPTIONS = {
  max: 5,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 10_000,
} as const satisfies PoolConfig

type DbEnv = Record<string, string | undefined>

export function buildPoolConfig(env: DbEnv = process.env): PoolConfig {
  // Remove pgbouncer param via string replace to avoid URL re-encoding the password
  const connectionString = (env.DATABASE_URL ?? '')
    .replace('?pgbouncer=true', '')
    .replace('&pgbouncer=true', '')

  // Supabase pooler 需要 SSL；CI/本機測試用的 disposable Postgres（無憑證）不支援 SSL 連線，
  // 故以 DATABASE_SSL=false 選填 env 提供退出口，未設時維持原本強制 SSL（production 零影響）。
  const useSsl = env.DATABASE_SSL !== 'false'
  return {
    connectionString,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    ...POOL_OPTIONS,
  }
}

export function createPrismaClient() {
  // 自建 pool（而非把設定物件交給 PrismaPg 內部建）才拿得到 pool 參照交給 attachDatabasePool：
  // Vercel Fluid 下它會讓實例多撐一下、把閒置連線關乾淨再暫停。非 Vercel runtime（本機、CI、
  // next build）缺 VERCEL_URL/VERCEL_REGION 時為 no-op。
  const pool = new Pool(buildPoolConfig())
  attachDatabasePool(pool)
  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
