import { describe, it, expect } from 'vitest'
import { parseSetCardQuery, buildSetCardPrismaWhere } from '../parse-set-card-query'

describe('parseSetCardQuery', () => {
  describe('觸發 pattern', () => {
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

    it('OP16-002 → { setCode: "op16", num: "002" }（OPCG 也觸發，additive OR 行為正確）', () => {
      expect(parseSetCardQuery('OP16-002')).toEqual({ setCode: 'op16', num: '002' })
    })
  })

  describe('不觸發 pattern', () => {
    it('pikachu → null（純文字）', () => {
      expect(parseSetCardQuery('pikachu')).toBeNull()
    })

    it('sv8 → null（無 num 部分）', () => {
      expect(parseSetCardQuery('sv8')).toBeNull()
    })

    it('001 → null（無 setCode 部分）', () => {
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
  it('num="001" 時 OR 條件含 equals "001"、equals "1"、startsWith "001/"、endsWith "-001"', () => {
    const result = buildSetCardPrismaWhere({ setCode: 'sv8', num: '001' })
    expect(result.set).toEqual({
      externalId: { equals: 'sv8', mode: 'insensitive' },
    })
    expect(result.OR).toEqual(
      expect.arrayContaining([
        { cardNumber: { equals: '001' } },
        { cardNumber: { equals: '1' } },
        { cardNumber: { startsWith: '001/' } },
        { cardNumber: { endsWith: '-001' } },
      ])
    )
  })

  it('num="1" 時 strippedNum 仍為 "1"，邏輯正確（equals "1" 出現兩次但不影響查詢）', () => {
    const result = buildSetCardPrismaWhere({ setCode: 'sv8', num: '1' })
    expect(result.OR).toEqual(
      expect.arrayContaining([
        { cardNumber: { equals: '1' } },
        { cardNumber: { startsWith: '1/' } },
        { cardNumber: { endsWith: '-1' } },
      ])
    )
  })

  it('num="100" 時 conditions 正確', () => {
    const result = buildSetCardPrismaWhere({ setCode: 'sv9pt5', num: '100' })
    expect(result.set).toEqual({
      externalId: { equals: 'sv9pt5', mode: 'insensitive' },
    })
    expect(result.OR).toEqual(
      expect.arrayContaining([
        { cardNumber: { equals: '100' } },
        { cardNumber: { startsWith: '100/' } },
        { cardNumber: { endsWith: '-100' } },
      ])
    )
  })

  it('setCode 保持小寫（由 parseSetCardQuery 已正規化）', () => {
    const result = buildSetCardPrismaWhere({ setCode: 'sv8b', num: '001' })
    expect(result.set).toEqual({
      externalId: { equals: 'sv8b', mode: 'insensitive' },
    })
  })
})
