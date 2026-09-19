import { describe, it, expect } from 'vitest'
import { DEFAULT_LOCALE, matchAcceptLanguage, resolveLocale, toParamLocale } from '../locale'

describe('matchAcceptLanguage（proxy 的 locale 協商，[locale] 段導入後須維持原行為）', () => {
  it.each([
    ['zh-Hant-TW', 'zh-TW'],
    ['zh-Hant', 'zh-TW'],
    ['zh', 'zh-TW'],
    ['zh-TW', 'zh-TW'],
    ['en-US', 'en'],
    ['ja-JP', 'ja'],
  ])('%s → %s', (header, expected) => {
    expect(matchAcceptLanguage(header)).toBe(expected)
  })

  it('依 q 權重取最高者', () => {
    expect(matchAcceptLanguage('en;q=0.5, ja;q=0.9, zh-Hant;q=0.1')).toBe('ja')
  })

  it('無 header 或無支援語言 → 預設 zh-TW', () => {
    expect(matchAcceptLanguage(null)).toBe(DEFAULT_LOCALE)
    expect(matchAcceptLanguage('fr-FR, de;q=0.8')).toBe(DEFAULT_LOCALE)
  })
})

describe('resolveLocale', () => {
  it('合法 cookie 優先於 Accept-Language', () => {
    expect(resolveLocale('en', 'ja-JP')).toBe('en')
  })

  it('cookie 值不合法時退回 Accept-Language', () => {
    expect(resolveLocale('xx', 'ja-JP')).toBe('ja')
  })
})

describe('toParamLocale', () => {
  it('合法 locale 原樣回傳', () => {
    expect(toParamLocale('ja')).toBe('ja')
  })

  it('非法或缺值 → 預設 zh-TW', () => {
    expect(toParamLocale('xx')).toBe(DEFAULT_LOCALE)
    expect(toParamLocale(undefined)).toBe(DEFAULT_LOCALE)
  })
})
