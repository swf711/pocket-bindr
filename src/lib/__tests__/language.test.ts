import { describe, it, expect } from 'vitest'
import { Language } from '@prisma/client'
import { parseLanguage, DEFAULT_LANGUAGE } from '../language'

describe('parseLanguage', () => {
  it('null 時回傳預設語言 EN', () => {
    expect(parseLanguage(null)).toBe(Language.EN)
    expect(parseLanguage(null)).toBe(DEFAULT_LANGUAGE)
  })

  it('空字串時回傳預設語言 EN', () => {
    expect(parseLanguage('')).toBe(Language.EN)
  })

  it('有效值回傳對應的 Language enum', () => {
    expect(parseLanguage('EN')).toBe(Language.EN)
    expect(parseLanguage('JA')).toBe(Language.JA)
    expect(parseLanguage('ZH_TW')).toBe(Language.ZH_TW)
  })

  it('無效值回傳 null', () => {
    expect(parseLanguage('xx')).toBeNull()
    expect(parseLanguage('en')).toBeNull()
    expect(parseLanguage('zh-tw')).toBeNull()
  })
})
