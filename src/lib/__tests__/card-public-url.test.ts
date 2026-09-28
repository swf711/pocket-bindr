import { describe, it, expect, vi, afterEach } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('cardPublicUrl / cardPublicPath（總開關未設）', () => {
  it('未設時 cardPublicUrl 回主站 cardPath（與現行逐字元一致）', async () => {
    vi.stubEnv('NEXT_PUBLIC_CARD_PAGES_ORIGIN', '')
    const { cardPublicUrl, cardPath } = await import('../card-url')
    const card = { game: 'PTCG' as const, language: 'EN' as const, externalId: 'sv3-25' }
    expect(cardPublicUrl(card)).toBe(cardPath(card))
    expect(cardPublicUrl(card)).toBe('/cards/ptcg/en/sv3-25')
  })
})

describe('cardPublicUrl / cardPublicPath（總開關已設）', () => {
  const ORIGIN = 'https://cards.pocketbindr.app'

  it('已設時回子網域、不含 /cards 前綴', async () => {
    vi.stubEnv('NEXT_PUBLIC_CARD_PAGES_ORIGIN', ORIGIN)
    const { cardPublicUrl, cardPublicPath } = await import('../card-url')
    const card = { game: 'PTCG' as const, language: 'EN' as const, externalId: 'sv3-25' }
    expect(cardPublicPath(card)).toBe('/ptcg/en/sv3-25')
    expect(cardPublicUrl(card)).toBe(`${ORIGIN}/ptcg/en/sv3-25`)
  })

  it('externalId 特殊字元（ex10-!、含 ?、含 /）編碼與 cardPath 一致', async () => {
    vi.stubEnv('NEXT_PUBLIC_CARD_PAGES_ORIGIN', ORIGIN)
    const { cardPublicPath, cardPath } = await import('../card-url')
    const cases = ['ex10-!', 'sv1?p=1', 'sv/1']
    for (const externalId of cases) {
      const card = { game: 'OPCG' as const, language: 'JA' as const, externalId }
      const publicPath = cardPublicPath(card)
      const appPath = cardPath(card)
      expect(publicPath).toBe(`/${appPath.split('/').slice(2).join('/')}`)
      expect(publicPath).toContain(encodeURIComponent(externalId))
    }
  })

  it('OPCG ZH_TW alias 卡回自己的 URL，不轉址到 canonical', async () => {
    vi.stubEnv('NEXT_PUBLIC_CARD_PAGES_ORIGIN', ORIGIN)
    const { cardPublicUrl } = await import('../card-url')
    const card = { game: 'OPCG' as const, language: 'ZH_TW' as const, externalId: 'OP01-001' }
    expect(cardPublicUrl(card)).toBe(`${ORIGIN}/opcg/zh-tw/OP01-001`)
  })
})

describe('CARD_UI_LOCALE', () => {
  it('三語對映：EN→en、JA→ja、ZH_TW→zh-TW', async () => {
    const { CARD_UI_LOCALE } = await import('../card-url')
    expect(CARD_UI_LOCALE.EN).toBe('en')
    expect(CARD_UI_LOCALE.JA).toBe('ja')
    expect(CARD_UI_LOCALE.ZH_TW).toBe('zh-TW')
  })
})
