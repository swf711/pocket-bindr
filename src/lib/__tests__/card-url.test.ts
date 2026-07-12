import { describe, it, expect } from 'vitest'
import {
  cardPath,
  parseCardPathParams,
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
})
