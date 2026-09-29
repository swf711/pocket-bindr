import { describe, it, expect } from 'vitest'
import {
  cardPath,
  cardOgImagePath,
  parseCardPathParams,
  parseCardRouteParams,
  isPlausibleExternalId,
  pathToLang,
  pathToGame,
  langToPath,
  gameToPath,
  CARD_OG_LOCALE,
} from '../card-url'

describe('card-url', () => {
  it('cardPath 組出 PTCG EN 路徑', () => {
    expect(cardPath({ game: 'PTCG', language: 'EN', externalId: 'sv3-25' })).toBe('/cards/ptcg/en/sv3-25')
  })

  it('cardPath 組出 OPCG JA 路徑', () => {
    expect(cardPath({ game: 'OPCG', language: 'JA', externalId: 'OP01-001' })).toBe('/cards/opcg/ja/OP01-001')
  })

  it('cardPath 對含特殊字元的 externalId 做 encode（OPCG parallel 卡含底線）', () => {
    expect(cardPath({ game: 'OPCG', language: 'EN', externalId: 'OP12-014_p2' })).toBe(
      '/cards/opcg/en/OP12-014_p2',
    )
  })

  it('langToPath / pathToLang 三語互轉', () => {
    expect(langToPath('EN')).toBe('en')
    expect(langToPath('JA')).toBe('ja')
    expect(langToPath('ZH_TW')).toBe('zh-tw')
    expect(pathToLang('zh-tw')).toBe('ZH_TW')
    expect(pathToLang('en')).toBe('EN')
    expect(pathToLang('ja')).toBe('JA')
  })

  it('pathToLang 對非法字串回 null', () => {
    expect(pathToLang('fr')).toBeNull()
    expect(pathToLang('')).toBeNull()
  })

  it('gameToPath / pathToGame 互轉', () => {
    expect(gameToPath('PTCG')).toBe('ptcg')
    expect(gameToPath('OPCG')).toBe('opcg')
    expect(pathToGame('ptcg')).toBe('PTCG')
    expect(pathToGame('opcg')).toBe('OPCG')
  })

  it('pathToGame 對非法字串回 null', () => {
    expect(pathToGame('tcg')).toBeNull()
  })

  it('parseCardPathParams 合法組合回 game/language', () => {
    expect(parseCardPathParams('ptcg', 'ja')).toEqual({ game: 'PTCG', language: 'JA' })
  })

  it('parseCardPathParams 非法 game 回 null', () => {
    expect(parseCardPathParams('nope', 'en')).toBeNull()
  })

  it('parseCardPathParams 非法 language 回 null', () => {
    expect(parseCardPathParams('ptcg', 'nope')).toBeNull()
  })

  it('CARD_OG_LOCALE 三語映射正確', () => {
    expect(CARD_OG_LOCALE.EN).toBe('en_US')
    expect(CARD_OG_LOCALE.JA).toBe('ja_JP')
    expect(CARD_OG_LOCALE.ZH_TW).toBe('zh_TW')
  })

  it('cardOgImagePath：卡片路徑 + /opengraph-image，無 locale 前綴、無 hash 後綴', () => {
    expect(cardOgImagePath({ game: 'OPCG', language: 'JA', externalId: 'OP01-001_p1' })).toBe(
      '/cards/opcg/ja/OP01-001_p1/opengraph-image',
    )
    expect(cardOgImagePath({ game: 'PTCG', language: 'EN', externalId: 'a b' })).toBe(
      '/cards/ptcg/en/a%20b/opengraph-image',
    )
  })

  describe('isPlausibleExternalId', () => {
    it('接受各種實際出現過的 externalId 形態', () => {
      expect(isPlausibleExternalId('sv3-1')).toBe(true)
      expect(isPlausibleExternalId('tw-123')).toBe(true)
      expect(isPlausibleExternalId('OP01-001_p1')).toBe(true)
      expect(isPlausibleExternalId('DON-TCG-677570')).toBe(true)
      // Unown 系列含 !/? 的 externalId
      expect(isPlausibleExternalId('ex10-!')).toBe(true)
      expect(isPlausibleExternalId('ex10-?')).toBe(true)
    })

    it('拒絕空字串', () => {
      expect(isPlausibleExternalId('')).toBe(false)
    })

    it('拒絕超過 64 字元', () => {
      expect(isPlausibleExternalId('a'.repeat(65))).toBe(false)
      expect(isPlausibleExternalId('a'.repeat(64))).toBe(true)
    })

    it('拒絕含 / 空白 < > % 等非法字元的值', () => {
      expect(isPlausibleExternalId('a/b')).toBe(false)
      expect(isPlausibleExternalId('a b')).toBe(false)
      expect(isPlausibleExternalId('<script>')).toBe(false)
      expect(isPlausibleExternalId('a%20b')).toBe(false)
    })
  })

  describe('parseCardRouteParams', () => {
    it('合法三段回 game/language/externalId（含 decode）', () => {
      expect(parseCardRouteParams('ptcg', 'en', 'sv3-1')).toEqual({
        game: 'PTCG',
        language: 'EN',
        externalId: 'sv3-1',
      })
      expect(parseCardRouteParams('opcg', 'en', 'OP12-014_p2')).toEqual({
        game: 'OPCG',
        language: 'EN',
        externalId: 'OP12-014_p2',
      })
    })

    it('game 不合法回 null', () => {
      expect(parseCardRouteParams('nope', 'en', 'sv3-1')).toBeNull()
    })

    it('language 不合法回 null', () => {
      expect(parseCardRouteParams('ptcg', 'nope', 'sv3-1')).toBeNull()
    })

    it('externalId decode 失敗（非法 % escape）回 null 不 throw', () => {
      expect(() => parseCardRouteParams('ptcg', 'en', '%E0%A4%A')).not.toThrow()
      expect(parseCardRouteParams('ptcg', 'en', '%E0%A4%A')).toBeNull()
    })

    it('externalId 過長或含非法字元回 null', () => {
      expect(parseCardRouteParams('ptcg', 'en', 'a'.repeat(65))).toBeNull()
      expect(parseCardRouteParams('ptcg', 'en', 'a/b')).toBeNull()
    })
  })
})
