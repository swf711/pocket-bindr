import { describe, it, expect, vi, afterEach } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('buildCardShareUrl（總開關已設）', () => {
  it('回子網域絕對網址，與呼叫端傳入的 origin 無關', async () => {
    vi.stubEnv('NEXT_PUBLIC_CARD_PAGES_ORIGIN', 'https://cards.pocketbindr.app')
    const { buildCardShareUrl } = await import('../share-card')
    const url = buildCardShareUrl(
      { game: 'PTCG', language: 'EN', externalId: 'sv3-125' },
      'https://pocketbindr.app',
    )
    expect(url).toBe('https://cards.pocketbindr.app/ptcg/en/sv3-125')
  })
})
