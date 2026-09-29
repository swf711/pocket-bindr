import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAttachDatabasePool = vi.fn()
vi.mock('@vercel/functions', () => ({
  attachDatabasePool: (...args: unknown[]) => mockAttachDatabasePool(...args),
}))

const mockPrismaPg = vi.fn()
vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: class {
    constructor(...args: unknown[]) {
      mockPrismaPg(...args)
    }
  },
}))

const mockPoolInstances: unknown[] = []
vi.mock('pg', () => ({
  Pool: class {
    options: unknown
    constructor(options: unknown) {
      this.options = options
      mockPoolInstances.push(this)
    }
  },
}))

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    constructor(...args: unknown[]) {
      Object.assign(this, { __args: args })
    }
  },
}))

const { buildPoolConfig, createPrismaClient, POOL_OPTIONS } = await import('../prisma')

describe('buildPoolConfig', () => {
  it('剝除 ?pgbouncer=true', () => {
    const config = buildPoolConfig({ DATABASE_URL: 'postgresql://u:p@host:5432/db?pgbouncer=true' })
    expect(config.connectionString).toBe('postgresql://u:p@host:5432/db')
  })

  it('剝除 &pgbouncer=true（其他參數在前）', () => {
    const config = buildPoolConfig({ DATABASE_URL: 'postgresql://u:p@host:5432/db?sslmode=require&pgbouncer=true' })
    expect(config.connectionString).toBe('postgresql://u:p@host:5432/db?sslmode=require')
  })

  it('未設 DATABASE_SSL 時帶 ssl.rejectUnauthorized=false', () => {
    const config = buildPoolConfig({ DATABASE_URL: 'postgresql://u:p@host:5432/db' })
    expect(config.ssl).toEqual({ rejectUnauthorized: false })
  })

  it('DATABASE_SSL=false 時不帶 ssl', () => {
    const config = buildPoolConfig({ DATABASE_URL: 'postgresql://u:p@host:5432/db', DATABASE_SSL: 'false' })
    expect(config.ssl).toBeUndefined()
  })

  it('帶上 POOL_OPTIONS（max/idleTimeoutMillis/connectionTimeoutMillis）', () => {
    const config = buildPoolConfig({ DATABASE_URL: 'postgresql://u:p@host:5432/db' })
    expect(config.max).toBe(5)
    expect(config.idleTimeoutMillis).toBe(5_000)
    expect(config.connectionTimeoutMillis).toBe(10_000)
    expect(POOL_OPTIONS).toEqual({ max: 5, idleTimeoutMillis: 5_000, connectionTimeoutMillis: 10_000 })
  })
})

describe('createPrismaClient', () => {
  beforeEach(() => {
    mockAttachDatabasePool.mockClear()
    mockPrismaPg.mockClear()
    mockPoolInstances.length = 0
  })

  it('以 pg.Pool 建立（而非把設定物件直接交給 PrismaPg）', () => {
    createPrismaClient()
    expect(mockPoolInstances).toHaveLength(1)
    expect(mockPrismaPg).toHaveBeenCalledWith(mockPoolInstances[0])
  })

  it('呼叫 attachDatabasePool(pool) 恰一次，且傳入同一個 pool', () => {
    createPrismaClient()
    expect(mockAttachDatabasePool).toHaveBeenCalledTimes(1)
    expect(mockAttachDatabasePool).toHaveBeenCalledWith(mockPoolInstances[0])
  })
})
