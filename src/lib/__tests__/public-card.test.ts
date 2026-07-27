import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: unknown) => fn),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    card: { findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
    $queryRaw: vi.fn(),
  },
}))

import { getPublicCardByTriple, getSameSetCards } from '../public-card'
import { prisma } from '@/lib/prisma'

/** 取出兜底 $queryRaw 實際送出的 SQL 字面（Prisma.Sql 的 template 片段）。 */
function lastRawSql() {
  const arg = vi.mocked(prisma.$queryRaw).mock.calls.at(-1)?.[0] as { strings: string[] }
  return arg.strings.join('?')
}

describe('getPublicCardByTriple', () => {
  beforeEach(() => vi.clearAllMocks())

  it('精確比對命中回完整 DTO', async () => {
    const row = { id: 'c1', externalId: 'sv3-25', set: { id: 'set1' }, canonicalCard: null }
    vi.mocked(prisma.card.findUnique).mockResolvedValue(row as never)

    const result = await getPublicCardByTriple('PTCG', 'EN', 'sv3-25')

    expect(result).toEqual(row)
    expect(prisma.$queryRaw).not.toHaveBeenCalled()
  })

  it('精確比對查無回 null（無 insensitive 候選）', async () => {
    vi.mocked(prisma.card.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.$queryRaw).mockResolvedValue([] as never)

    const result = await getPublicCardByTriple('PTCG', 'EN', 'missing')

    expect(result).toBeNull()
  })

  it('externalId 大小寫不符時 insensitive 兜底命中', async () => {
    const row = { id: 'c2', externalId: 'OP12-014_p2' }
    vi.mocked(prisma.card.findUnique)
      .mockResolvedValueOnce(null) // 精確比對 miss
      .mockResolvedValueOnce(row as never) // 兜底取得 id 後回頭撈完整 DTO
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ id: 'c2' }] as never)

    const result = await getPublicCardByTriple('OPCG', 'EN', 'op12-014_p2')

    expect(result).toEqual(row)
    expect(prisma.card.findUnique).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { id: 'c2' } }),
    )
  })

  it('兜底 SQL 用 lower() 等值比對，且 enum cast 下在參數而非欄位', async () => {
    // 表達式索引 (game, language, lower(externalId)) 的命中前提：
    // 用 ILIKE 或把 cast 下在欄位（"game"::text = $1）都會讓索引失效退回 Seq Scan。
    vi.mocked(prisma.card.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.$queryRaw).mockResolvedValue([] as never)

    await getPublicCardByTriple('PTCG', 'JA', 'ANY-CASE')

    const sql = lastRawSql()
    expect(sql).toContain('lower("externalId") = lower(')
    expect(sql).toContain('::"Game"')
    expect(sql).toContain('::"Language"')
    expect(sql).not.toContain('ILIKE')
    expect(sql).not.toContain('"game"::text')
  })
})

describe('getSameSetCards', () => {
  beforeEach(() => vi.clearAllMocks())

  it('排除自身、限制數量、有卡號優先排序（走 $queryRaw 取 id）', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ id: 'c2' }] as never)
    vi.mocked(prisma.card.findMany).mockResolvedValue([{ id: 'c2' }] as never)

    await getSameSetCards('set1', 'c1', 18)

    const sql = lastRawSql()
    expect(sql).toContain('"setId" =')
    expect(sql).toContain('"id" <>')
    expect(sql).toContain('LIMIT')
    // 有卡號優先：Postgres 的 '' 小於所有非空字串，直接 cardNumber ASC 會讓無卡號卡排最前面
    expect(sql).toContain(`NULLIF("cardNumber", '') ASC NULLS LAST`)

    const values = (vi.mocked(prisma.$queryRaw).mock.calls.at(-1)?.[0] as { values: unknown[] }).values
    expect(values).toEqual(expect.arrayContaining(['set1', 'c1', 18]))
  })

  it('依 $queryRaw 回傳的 id 順序還原（findMany 不保證順序）', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ id: 'c3' }, { id: 'c2' }] as never)
    // findMany 以亂序回傳，結果仍須照 id 順序排列
    vi.mocked(prisma.card.findMany).mockResolvedValue([{ id: 'c2' }, { id: 'c3' }] as never)

    const result = await getSameSetCards('set1', 'c1', 18)

    expect(result.map((c) => c.id)).toEqual(['c3', 'c2'])
  })

  it('查無結果時不再打 findMany', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([] as never)

    const result = await getSameSetCards('set1', 'c1', 18)

    expect(result).toEqual([])
    expect(prisma.card.findMany).not.toHaveBeenCalled()
  })
})
