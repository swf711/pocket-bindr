import { describe, it, expect } from 'vitest'
import { parseSetCardQuery, buildSetCardPrismaWhere } from '../parse-set-card-query'

describe('parseSetCardQuery', () => {
  describe('set code + 卡號格式觸發', () => {
    it('sv8-001 → { setCode: "sv8", num: "001" }', () => {
      expect(parseSetCardQuery('sv8-001')).toEqual({ setCode: 'sv8', num: '001' })
    })

    it('sv9pt5-100 → { setCode: "sv9pt5", num: "100" }', () => {
      expect(parseSetCardQuery('sv9pt5-100')).toEqual({ setCode: 'sv9pt5', num: '100' })
    })

    it('sv8b-001 → { setCode: "sv8b", num: "001" }', () => {
      expect(parseSetCardQuery('sv8b-001')).toEqual({ setCode: 'sv8b', num: '001' })
    })

    it('SV8-001 大寫輸入 → setCode 正規化為小寫 "sv8"', () => {
      expect(parseSetCardQuery('SV8-001')).toEqual({ setCode: 'sv8', num: '001' })
    })

    it('a-1 最短合法格式', () => {
      expect(parseSetCardQuery('a-1')).toEqual({ setCode: 'a', num: '1' })
    })

    it('sv8-9999 4位數', () => {
      expect(parseSetCardQuery('sv8-9999')).toEqual({ setCode: 'sv8', num: '9999' })
    })

    it('SV8-00 前綴數字 → { setCode: "sv8", num: "00" }', () => {
      expect(parseSetCardQuery('SV8-00')).toEqual({ setCode: 'sv8', num: '00' })
    })

    it('OP16-002 → { setCode: "op16", num: "002" }（OPCG 也觸發，additive OR 行為正確）', () => {
      expect(parseSetCardQuery('OP16-002')).toEqual({ setCode: 'op16', num: '002' })
    })
  })

  describe('set-only 格式觸發（含數字的 set code）', () => {
    it('sv8 → { setCode: "sv8", num: null }', () => {
      expect(parseSetCardQuery('sv8')).toEqual({ setCode: 'sv8', num: null })
    })

    it('SV8 大寫 → { setCode: "sv8", num: null }', () => {
      expect(parseSetCardQuery('SV8')).toEqual({ setCode: 'sv8', num: null })
    })

    it('sv9pt5 → { setCode: "sv9pt5", num: null }', () => {
      expect(parseSetCardQuery('sv9pt5')).toEqual({ setCode: 'sv9pt5', num: null })
    })

    it('sv8b → { setCode: "sv8b", num: null }', () => {
      expect(parseSetCardQuery('sv8b')).toEqual({ setCode: 'sv8b', num: null })
    })

    it('OP16 → { setCode: "op16", num: null }', () => {
      expect(parseSetCardQuery('OP16')).toEqual({ setCode: 'op16', num: null })
    })

    it('base1 → { setCode: "base1", num: null }', () => {
      expect(parseSetCardQuery('base1')).toEqual({ setCode: 'base1', num: null })
    })
  })

  describe('不觸發 pattern', () => {
    it('pikachu → null（純文字，無數字）', () => {
      expect(parseSetCardQuery('pikachu')).toBeNull()
    })

    it('PTCG → null（純文字，無數字）', () => {
      expect(parseSetCardQuery('PTCG')).toBeNull()
    })

    it('001 → null（不以字母開頭）', () => {
      expect(parseSetCardQuery('001')).toBeNull()
    })

    it('sv8-00001 5位數 → null（超出 \\d{1,4} 上限）', () => {
      expect(parseSetCardQuery('sv8-00001')).toBeNull()
    })

    it('空字串 → null', () => {
      expect(parseSetCardQuery('')).toBeNull()
    })

    it('-001 → null（setCode 不可為空）', () => {
      expect(parseSetCardQuery('-001')).toBeNull()
    })

    it('1sv-001 → null（setCode 需字母開頭）', () => {
      expect(parseSetCardQuery('1sv-001')).toBeNull()
    })

    it('sv8-abc → null（num 需為純數字）', () => {
      expect(parseSetCardQuery('sv8-abc')).toBeNull()
    })
  })
})

describe('buildSetCardPrismaWhere', () => {
  it('num=null（set-only）→ 只有 set filter，無 OR', () => {
    const result = buildSetCardPrismaWhere({ setCode: 'sv8', num: null })
    expect(result).toEqual({
      set: { externalId: { equals: 'sv8', mode: 'insensitive' } },
    })
    expect(result.OR).toBeUndefined()
  })

  it('num="001" → OR 含 equals "001"、equals "1"、startsWith "001"（JA 前綴）、startsWith "sv8-001"（ZH_TW 前綴）', () => {
    const result = buildSetCardPrismaWhere({ setCode: 'sv8', num: '001' })
    expect(result.set).toEqual({
      externalId: { equals: 'sv8', mode: 'insensitive' },
    })
    expect(result.OR).toEqual(
      expect.arrayContaining([
        { cardNumber: { equals: '001' } },
        { cardNumber: { equals: '1' } },
        { cardNumber: { startsWith: '001', mode: 'insensitive' } },
        { cardNumber: { startsWith: 'sv8-001', mode: 'insensitive' } },
      ])
    )
  })

  it('num="00"（前綴搜尋）→ startsWith "00" 可配 JA "001/095"；startsWith "sv8-00" 可配 ZH_TW "SV8-001"', () => {
    const result = buildSetCardPrismaWhere({ setCode: 'sv8', num: '00' })
    expect(result.OR).toEqual(
      expect.arrayContaining([
        { cardNumber: { startsWith: '00', mode: 'insensitive' } },
        { cardNumber: { startsWith: 'sv8-00', mode: 'insensitive' } },
      ])
    )
  })

  it('num="1" 時 strippedNum 仍為 "1"，邏輯正確', () => {
    const result = buildSetCardPrismaWhere({ setCode: 'sv8', num: '1' })
    expect(result.OR).toEqual(
      expect.arrayContaining([
        { cardNumber: { equals: '1' } },
        { cardNumber: { startsWith: '1', mode: 'insensitive' } },
        { cardNumber: { startsWith: 'sv8-1', mode: 'insensitive' } },
      ])
    )
  })

  it('setCode 保持小寫（由 parseSetCardQuery 已正規化）', () => {
    const result = buildSetCardPrismaWhere({ setCode: 'sv8w', num: '001' })
    expect(result.set).toEqual({
      externalId: { equals: 'sv8w', mode: 'insensitive' },
    })
    expect(result.OR).toEqual(
      expect.arrayContaining([
        { cardNumber: { startsWith: 'sv8w-001', mode: 'insensitive' } },
      ])
    )
  })
})
