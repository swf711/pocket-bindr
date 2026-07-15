import { describe, it, expect, vi } from 'vitest'
import { resolveCanonicalCardId, deriveDisplayCardId, resolveCanonicalCardIds } from '../resolve-canonical-card'

function mockClient(responses: unknown[]) {
  const findUnique = vi.fn()
  responses.forEach((r) => findUnique.mockResolvedValueOnce(r))
  return { card: { findUnique } } as never
}

function mockBatchClient(findManyResponses: unknown[][]) {
  const findMany = vi.fn()
  findManyResponses.forEach((r) => findMany.mockResolvedValueOnce(r))
  return { card: { findMany } } as never
}

describe('resolveCanonicalCardId', () => {
  it('卡不存在回傳 not_found', async () => {
    const client = mockClient([null])
    const result = await resolveCanonicalCardId(client, 'missing')
    expect(result).toEqual({ status: 'not_found' })
  })

  it('非 alias 卡回傳原 cardId', async () => {
    const client = mockClient([{ isCollectible: true, canonicalCardId: null }])
    const result = await resolveCanonicalCardId(client, 'c1')
    expect(result).toEqual({ status: 'ok', resolvedCardId: 'c1' })
  })

  it('alias 卡（isCollectible=false）解析至 canonicalCardId', async () => {
    const client = mockClient([
      { isCollectible: false, canonicalCardId: 'ja-c1' },
      { id: 'ja-c1' },
    ])
    const result = await resolveCanonicalCardId(client, 'zhtw-c1')
    expect(result).toEqual({ status: 'ok', resolvedCardId: 'ja-c1' })
  })

  it('alias 卡的 canonical 不存在回傳 canonical_missing', async () => {
    const client = mockClient([
      { isCollectible: false, canonicalCardId: 'ja-c1' },
      null,
    ])
    const result = await resolveCanonicalCardId(client, 'zhtw-c1')
    expect(result).toEqual({ status: 'canonical_missing' })
  })
})

describe('resolveCanonicalCardIds', () => {
  it('批次 resolve：一般卡→自身、OPCG ZH_TW alias→canonical', async () => {
    const client = mockBatchClient([
      [
        { id: 'c1', isCollectible: true, canonicalCardId: null },
        { id: 'zhtw-c1', isCollectible: false, canonicalCardId: 'ja-c1' },
      ],
      [{ id: 'ja-c1' }],
    ])
    const result = await resolveCanonicalCardIds(client, ['c1', 'zhtw-c1'])
    expect(result.get('c1')).toEqual({ status: 'ok', resolvedCardId: 'c1' })
    expect(result.get('zhtw-c1')).toEqual({ status: 'ok', resolvedCardId: 'ja-c1' })
  })

  it('canonical 缺失→canonical_missing、id 不存在→not_found', async () => {
    const client = mockBatchClient([
      [{ id: 'zhtw-c1', isCollectible: false, canonicalCardId: 'ja-missing' }],
      [], // canonical existence check returns none
    ])
    const result = await resolveCanonicalCardIds(client, ['zhtw-c1', 'unknown'])
    expect(result.get('zhtw-c1')).toEqual({ status: 'canonical_missing' })
    expect(result.get('unknown')).toEqual({ status: 'not_found' })
  })

  it('去重 cardIds，不重複查詢', async () => {
    const client = mockBatchClient([
      [{ id: 'c1', isCollectible: true, canonicalCardId: null }],
    ])
    const result = await resolveCanonicalCardIds(client, ['c1', 'c1'])
    expect(result.size).toBe(1)
    expect(result.get('c1')).toEqual({ status: 'ok', resolvedCardId: 'c1' })
  })
})

describe('deriveDisplayCardId', () => {
  it('alias（原 id ≠ resolved）時回傳原始 id 當 displayCardId', () => {
    expect(deriveDisplayCardId('zhtw-c1', 'ja-c1')).toBe('zhtw-c1')
  })

  it('純 canonical（原 id = resolved）時回傳 null（不記 displayCardId）', () => {
    expect(deriveDisplayCardId('c1', 'c1')).toBeNull()
  })
})
