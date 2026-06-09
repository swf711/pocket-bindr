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

  const adapter = new PrismaPg({ connectionString, ssl: { rejectUnauthorized: false } })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
