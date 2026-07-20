import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Remove pgbouncer param via string replace to avoid URL re-encoding the password
  const connectionString = (process.env.DATABASE_URL ?? '')
    .replace('?pgbouncer=true', '')
    .replace('&pgbouncer=true', '')

  // Supabase pooler 需要 SSL；CI/本機測試用的 disposable Postgres（無憑證）不支援 SSL 連線，
  // 故以 DATABASE_SSL=false 選填 env 提供退出口，未設時維持原本強制 SSL（production 零影響）。
  const useSsl = process.env.DATABASE_SSL !== 'false'
  const adapter = new PrismaPg({
    connectionString,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
