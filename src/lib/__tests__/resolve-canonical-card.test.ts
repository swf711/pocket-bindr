import { describe, it, expect, vi } from 'vitest'
import { resolveCanonicalCardId, deriveDisplayCardId } from '../resolve-canonical-card'

function mockClient(responses: unknown[]) {
  const findUnique = vi.fn()
  responses.forEach((r) => findUnique.mockResolvedValueOnce(r))
  return { card: { findUnique } } as never
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

describe('deriveDisplayCardId', () => {
  it('alias（原 id ≠ resolved）時回傳原始 id 當 displayCardId', () => {
    expect(deriveDisplayCardId('zhtw-c1', 'ja-c1')).toBe('zhtw-c1')
  })

  it('純 canonical（原 id = resolved）時回傳 null（不記 displayCardId）', () => {
    expect(deriveDisplayCardId('c1', 'c1')).toBeNull()
  })
})
