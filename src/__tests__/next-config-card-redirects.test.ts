import { describe, it, expect, vi, afterEach } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('next.config redirects（靜態卡片頁子網域轉址）', () => {
  it('總開關未設時不含卡片轉址規則', async () => {
    vi.stubEnv('NEXT_PUBLIC_CARD_PAGES_ORIGIN', '')
    const { default: config } = await import('../../next.config')
    expect(config.redirects).toBeUndefined()
  })

  it('已設開關時規則 missing 同時含 rsc 與 next-action、statusCode 301、destination 正確', async () => {
    vi.stubEnv('NEXT_PUBLIC_CARD_PAGES_ORIGIN', 'https://cards.pocketbindr.app')
    const { default: config } = await import('../../next.config')
    expect(config.redirects).toBeDefined()
    const rules = await config.redirects!()
    const rule = rules.find(r => r.source.startsWith('/cards/'))
    expect(rule).toBeDefined()
    expect(rule!.statusCode).toBe(301)
    expect(rule!).not.toHaveProperty('permanent')
    expect(rule!.missing).toEqual(
      expect.arrayContaining([
        { type: 'header', key: 'rsc' },
        { type: 'header', key: 'next-action' },
      ]),
    )
    expect(rule!.destination).toBe('https://cards.pocketbindr.app/:game/:language/:externalId')
  })

  it('規則的 source 只吃三段，不會比對到帶 opengraph-image 的五段路徑', async () => {
    vi.stubEnv('NEXT_PUBLIC_CARD_PAGES_ORIGIN', 'https://cards.pocketbindr.app')
    const { default: config } = await import('../../next.config')
    const rules = await config.redirects!()
    const rule = rules.find(r => r.source.startsWith('/cards/'))!
    // path-to-regexp 具名段語意：:externalId 不含 named wildcard 修飾，只吃一段（無斜線）。
    expect(rule.source).toBe('/cards/:game(ptcg|opcg)/:language(en|ja|zh-tw)/:externalId')
  })
})
