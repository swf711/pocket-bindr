import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Strip pgbouncer param — not understood by pg driver
  const rawUrl = process.env.DATABASE_URL!
  const url = new URL(rawUrl)
  url.searchParams.delete('pgbouncer')

  const adapter = new PrismaPg(
    { connectionString: url.toString(), ssl: { rejectUnauthorized: false } },
  )
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
