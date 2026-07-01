import { describe, it, expect, vi } from 'vitest'
import { buildCrossLangExpansion, resolveOpcgCrossLangCardIds } from '../cross-language-search'

vi.mock('@/lib/pokemon-name-dictionary', () => ({
  expandPokemonNameTerms: vi.fn((q: string, lang: string) => {
    if (q === '皮卡丘' && lang === 'JA') return ['ピカチュウ']
    if (q === '皮卡丘' && lang === 'EN') return ['Pikachu']
    return []
  }),
}))

function mockClient(findManyResult: unknown[]) {
  return { card: { findMany: vi.fn().mockResolvedValue(findManyResult) } } as never
}

describe('resolveOpcgCrossLangCardIds', () => {
  it('lang 非 JA 回傳 []', async () => {
    const client = mockClient([])
    expect(await resolveOpcgCrossLangCardIds(client, 'ZH_TW', '魯夫')).toEqual([])
  })

  it('q 為空回傳 []', async () => {
    const client = mockClient([])
    expect(await resolveOpcgCrossLangCardIds(client, 'JA', '')).toEqual([])
  })

  it('JA + 繁中名 → 回傳對應 canonicalCardId（去重）', async () => {
    const client = mockClient([
      { canonicalCardId: 'ja-op01-001' },
      { canonicalCardId: 'ja-op01-001' },
      { canonicalCardId: 'ja-op02-005' },
    ])
    const result = await resolveOpcgCrossLangCardIds(client, 'JA', '魯夫')
    expect(result.sort()).toEqual(['ja-op01-001', 'ja-op02-005'])
  })

  it('台灣限定卡（canonicalCardId=null）已由 query where 過濾，不出現在結果', async () => {
    const client = mockClient([{ canonicalCardId: 'ja-op01-001' }])
    const result = await resolveOpcgCrossLangCardIds(client, 'JA', '限定卡')
    expect(result).toEqual(['ja-op01-001'])
  })
})

describe('buildCrossLangExpansion', () => {
  it('q 為空 → { nameTerms: [], cardIds: [] }', async () => {
    const client = mockClient([])
    expect(await buildCrossLangExpansion(client, 'PTCG', 'JA', '')).toEqual({ nameTerms: [], cardIds: [] })
  })

  it('PTCG JA + 皮卡丘 → nameTerms 含 ピカチュウ、cardIds 為空', async () => {
    const client = mockClient([])
    const result = await buildCrossLangExpansion(client, 'PTCG', 'JA', '皮卡丘')
    expect(result).toEqual({ nameTerms: ['ピカチュウ'], cardIds: [] })
  })

  it('OPCG JA + 魯夫 → 以 ZH_TW alias 查 canonicalCardId，cardIds 含對應 JA id', async () => {
    const client = mockClient([{ canonicalCardId: 'ja-op01-001' }])
    const result = await buildCrossLangExpansion(client, 'OPCG', 'JA', '魯夫')
    expect(result).toEqual({ nameTerms: [], cardIds: ['ja-op01-001'] })
  })

  it('OPCG ZH_TW + 魯夫 → cardIds 為空（ZH_TW 原生可搜，不反向解析）', async () => {
    const client = mockClient([])
    const result = await buildCrossLangExpansion(client, 'OPCG', 'ZH_TW', '魯夫')
    expect(result).toEqual({ nameTerms: [], cardIds: [] })
    expect((client as { card: { findMany: ReturnType<typeof vi.fn> } }).card.findMany).not.toHaveBeenCalled()
  })

  it('OPCG JA + 台灣限定卡名（無 JA 對應）→ cardIds 為空', async () => {
    const client = mockClient([])
    const result = await buildCrossLangExpansion(client, 'OPCG', 'JA', '台灣限定卡名')
    expect(result).toEqual({ nameTerms: [], cardIds: [] })
  })
})
