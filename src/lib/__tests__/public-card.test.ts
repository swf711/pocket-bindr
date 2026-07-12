import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: unknown) => fn),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    card: { findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
  },
}))

import { getPublicCardByTriple, getSameSetCards } from '../public-card'
import { prisma } from '@/lib/prisma'

describe('getPublicCardByTriple', () => {
  beforeEach(() => vi.clearAllMocks())

  it('精確比對命中回完整 DTO', async () => {
    const row = { id: 'c1', externalId: 'sv3-25', set: { id: 'set1' }, canonicalCard: null }
    vi.mocked(prisma.card.findUnique).mockResolvedValue(row as never)

    const result = await getPublicCardByTriple('PTCG', 'EN', 'sv3-25')

    expect(result).toEqual(row)
    expect(prisma.card.findFirst).not.toHaveBeenCalled()
  })

  it('精確比對查無回 null（無 insensitive 候選）', async () => {
    vi.mocked(prisma.card.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.card.findFirst).mockResolvedValue(null)

    const result = await getPublicCardByTriple('PTCG', 'EN', 'missing')

    expect(result).toBeNull()
  })

  it('externalId 大小寫不符時 insensitive 兜底命中', async () => {
    vi.mocked(prisma.card.findUnique).mockResolvedValue(null)
    const row = { id: 'c2', externalId: 'OP12-014_p2' }
    vi.mocked(prisma.card.findFirst).mockResolvedValue(row as never)

    const result = await getPublicCardByTriple('OPCG', 'EN', 'op12-014_p2')

    expect(result).toEqual(row)
    expect(prisma.card.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          externalId: { equals: 'op12-014_p2', mode: 'insensitive' },
        }),
      }),
    )
  })
})

describe('getSameSetCards', () => {
  beforeEach(() => vi.clearAllMocks())

  it('排除自身、依 cardNumber 排序、限制數量', async () => {
    vi.mocked(prisma.card.findMany).mockResolvedValue([{ id: 'c2' }] as never)

    await getSameSetCards('set1', 'c1', 18)

    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { setId: 'set1', id: { not: 'c1' } },
        take: 18,
        orderBy: { cardNumber: 'asc' },
      }),
    )
  })
})
