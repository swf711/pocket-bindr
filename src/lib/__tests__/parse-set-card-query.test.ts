import { describe, it, expect } from 'vitest'
import {
  parseSetCardQuery,
  buildSetCardPrismaWhere,
  normalizeNumComponent,
} from '../parse-set-card-query'

describe('normalizeNumComponent', () => {
  it('036/190 → { num:"036", strippedNum:"36", fullSlash:"036/190" }', () => {
    expect(normalizeNumComponent('036/190')).toEqual({ num: '036', strippedNum: '36', fullSlash: '036/190' })
  })

  it('041/SV-P（字母分母）→ num 仍取分子', () => {
    expect(normalizeNumComponent('041/SV-P')).toEqual({ num: '041', strippedNum: '41', fullSlash: '041/SV-P' })
  })

  it('072（裸號）→ { num:"072", strippedNum:"72", fullSlash:null }', () => {
    expect(normalizeNumComponent('072')).toEqual({ num: '072', strippedNum: '72', fullSlash: null })
  })

  it('36（無前導零裸號）→ strippedNum 相同', () => {
    expect(normalizeNumComponent('36')).toEqual({ num: '36', strippedNum: '36', fullSlash: null })
  })

  it('非數字/非斜線形 → null', () => {
    expect(normalizeNumComponent('abc')).toBeNull()
    expect(normalizeNumComponent('')).toBeNull()
  })
})

describe('parseSetCardQuery', () => {
  describe('set code + 卡號格式觸發（連字號，回歸）', () => {
    it('sv8-001 → { setCode: "sv8", num: "001", fullSlash: null }', () => {
      expect(parseSetCardQuery('sv8-001')).toEqual({ setCode: 'sv8', num: '001', fullSlash: null })
    })

    it('sv9pt5-100 → { setCode: "sv9pt5", num: "100", fullSlash: null }', () => {
      expect(parseSetCardQuery('sv9pt5-100')).toEqual({ setCode: 'sv9pt5', num: '100', fullSlash: null })
    })

    it('sv8b-001 → { setCode: "sv8b", num: "001", fullSlash: null }', () => {
      expect(parseSetCardQuery('sv8b-001')).toEqual({ setCode: 'sv8b', num: '001', fullSlash: null })
    })

    it('SV8-001 大寫輸入 → setCode 正規化為小寫 "sv8"', () => {
      expect(parseSetCardQuery('SV8-001')).toEqual({ setCode: 'sv8', num: '001', fullSlash: null })
    })

    it('a-1 最短合法格式', () => {
      expect(parseSetCardQuery('a-1')).toEqual({ setCode: 'a', num: '1', fullSlash: null })
    })

    it('sv8-9999 4位數', () => {
      expect(parseSetCardQuery('sv8-9999')).toEqual({ setCode: 'sv8', num: '9999', fullSlash: null })
    })

    it('SV8-00 前綴數字 → { setCode: "sv8", num: "00", fullSlash: null }', () => {
      expect(parseSetCardQuery('SV8-00')).toEqual({ setCode: 'sv8', num: '00', fullSlash: null })
    })

    it('OP16-002 → { setCode: "op16", num: "002", fullSlash: null }（OPCG 也觸發，additive OR 行為正確）', () => {
      expect(parseSetCardQuery('OP16-002')).toEqual({ setCode: 'op16', num: '002', fullSlash: null })
    })
  })

  describe('一般化：空格分隔', () => {
    it('sv4a 036（空格+裸號）→ { setCode: "sv4a", num: "036", fullSlash: null }', () => {
      expect(parseSetCardQuery('sv4a 036')).toEqual({ setCode: 'sv4a', num: '036', fullSlash: null })
    })

    it('op11 072（OPCG 空格形）→ { setCode: "op11", num: "072", fullSlash: null }', () => {
      expect(parseSetCardQuery('op11 072')).toEqual({ setCode: 'op11', num: '072', fullSlash: null })
    })

    it('多餘空白正規化（多空格視為一個分隔）', () => {
      expect(parseSetCardQuery('sv4a   036')).toEqual({ setCode: 'sv4a', num: '036', fullSlash: null })
    })

    it('前後空白容忍', () => {
      expect(parseSetCardQuery('  sv4a 036  ')).toEqual({ setCode: 'sv4a', num: '036', fullSlash: null })
    })
  })

  describe('一般化：set + 斜線組合', () => {
    it('sv4a 036/190（空格+斜線）→ { setCode: "sv4a", num: "036", fullSlash: "036/190" }', () => {
      expect(parseSetCardQuery('sv4a 036/190')).toEqual({ setCode: 'sv4a', num: '036', fullSlash: '036/190' })
    })

    it('sv4a-036/190（連字號+斜線）→ { setCode: "sv4a", num: "036", fullSlash: "036/190" }', () => {
      expect(parseSetCardQuery('sv4a-036/190')).toEqual({ setCode: 'sv4a', num: '036', fullSlash: '036/190' })
    })

    it('op11-072/121（OPCG 連字號+斜線）', () => {
      expect(parseSetCardQuery('op11-072/121')).toEqual({ setCode: 'op11', num: '072', fullSlash: '072/121' })
    })
  })

  describe('一般化：斜線單獨形（無 set code）', () => {
    it('036/190 → { setCode: null, num: "036", fullSlash: "036/190" }', () => {
      expect(parseSetCardQuery('036/190')).toEqual({ setCode: null, num: '036', fullSlash: '036/190' })
    })

    it('041/SV-P（字母分母促銷卡）', () => {
      expect(parseSetCardQuery('041/SV-P')).toEqual({ setCode: null, num: '041', fullSlash: '041/SV-P' })
    })
  })

  describe('set-only 格式觸發（含數字的 set code，回歸）', () => {
    it('sv8 → { setCode: "sv8", num: null, fullSlash: null }', () => {
      expect(parseSetCardQuery('sv8')).toEqual({ setCode: 'sv8', num: null, fullSlash: null })
    })

    it('SV8 大寫 → { setCode: "sv8", num: null, fullSlash: null }', () => {
      expect(parseSetCardQuery('SV8')).toEqual({ setCode: 'sv8', num: null, fullSlash: null })
    })

    it('sv9pt5 → { setCode: "sv9pt5", num: null, fullSlash: null }', () => {
      expect(parseSetCardQuery('sv9pt5')).toEqual({ setCode: 'sv9pt5', num: null, fullSlash: null })
    })

    it('sv8b → { setCode: "sv8b", num: null, fullSlash: null }', () => {
      expect(parseSetCardQuery('sv8b')).toEqual({ setCode: 'sv8b', num: null, fullSlash: null })
    })

    it('OP16 → { setCode: "op16", num: null, fullSlash: null }', () => {
      expect(parseSetCardQuery('OP16')).toEqual({ setCode: 'op16', num: null, fullSlash: null })
    })

    it('base1 → { setCode: "base1", num: null, fullSlash: null }', () => {
      expect(parseSetCardQuery('base1')).toEqual({ setCode: 'base1', num: null, fullSlash: null })
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

    it('pikachu ex → null（第二 token 非數字/斜線形，不誤觸空格解析）', () => {
      expect(parseSetCardQuery('pikachu ex')).toBeNull()
    })
  })
})

describe('buildSetCardPrismaWhere', () => {
  it('num=null（set-only）→ 只有 set filter，無 OR', () => {
    const result = buildSetCardPrismaWhere({ setCode: 'sv8', num: null, fullSlash: null })
    expect(result).toEqual({
      set: { externalId: { equals: 'sv8', mode: 'insensitive' } },
    })
    expect(result.OR).toBeUndefined()
  })

  it('num="001" → OR 含 equals "001"、equals "1"、startsWith "001"（JA 前綴）、startsWith "sv8-001"（ZH_TW 前綴）', () => {
    const result = buildSetCardPrismaWhere({ setCode: 'sv8', num: '001', fullSlash: null })
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
    const result = buildSetCardPrismaWhere({ setCode: 'sv8', num: '00', fullSlash: null })
    expect(result.OR).toEqual(
      expect.arrayContaining([
        { cardNumber: { startsWith: '00', mode: 'insensitive' } },
        { cardNumber: { startsWith: 'sv8-00', mode: 'insensitive' } },
      ])
    )
  })

  it('num="1" 時 strippedNum 仍為 "1"，邏輯正確', () => {
    const result = buildSetCardPrismaWhere({ setCode: 'sv8', num: '1', fullSlash: null })
    expect(result.OR).toEqual(
      expect.arrayContaining([
        { cardNumber: { equals: '1' } },
        { cardNumber: { startsWith: '1', mode: 'insensitive' } },
        { cardNumber: { startsWith: 'sv8-1', mode: 'insensitive' } },
      ])
    )
  })

  it('setCode 保持小寫（由 parseSetCardQuery 已正規化）', () => {
    const result = buildSetCardPrismaWhere({ setCode: 'sv8w', num: '001', fullSlash: null })
    expect(result.set).toEqual({
      externalId: { equals: 'sv8w', mode: 'insensitive' },
    })
    expect(result.OR).toEqual(
      expect.arrayContaining([
        { cardNumber: { startsWith: 'sv8w-001', mode: 'insensitive' } },
      ])
    )
  })

  it('setCode==null 斜線單獨 → 無 set filter，OR 含 equals fullSlash（JA）+ equals strippedNum（EN）', () => {
    const result = buildSetCardPrismaWhere({ setCode: null, num: '036', fullSlash: '036/190' })
    expect(result.set).toBeUndefined()
    expect(result.OR).toEqual(
      expect.arrayContaining([
        { cardNumber: { equals: '036/190', mode: 'insensitive' } },
        { cardNumber: { equals: '36' } },
      ])
    )
  })

  it('set+num+fullSlash → EN 打中裸號（equals "36"）、JA 打中斜線精確（equals "036/190"）；不做分子 startsWith 廣撈', () => {
    const result = buildSetCardPrismaWhere({ setCode: 'sv4a', num: '036', fullSlash: '036/190' })
    expect(result.set).toEqual({ externalId: { equals: 'sv4a', mode: 'insensitive' } })
    expect(result.OR).toEqual(
      expect.arrayContaining([
        { cardNumber: { equals: '36' } },
        { cardNumber: { equals: '036/190', mode: 'insensitive' } },
      ])
    )
    // fullSlash 存在時不得再有分子 startsWith 廣撈（否則 036/190 會誤撈 036/081 等，實測 200+ 筆）
    expect(result.OR).not.toEqual(
      expect.arrayContaining([{ cardNumber: { startsWith: '036', mode: 'insensitive' } }]),
    )
  })

  it('斜線單獨 fullSlash → OR 不含任何 startsWith（純精確比對，避免跨 set 廣撈）', () => {
    const result = buildSetCardPrismaWhere({ setCode: null, num: '036', fullSlash: '036/190' })
    const hasStartsWith = (result.OR ?? []).some(
      c => typeof c === 'object' && c !== null && 'cardNumber' in c &&
        typeof c.cardNumber === 'object' && c.cardNumber !== null && 'startsWith' in c.cardNumber,
    )
    expect(hasStartsWith).toBe(false)
  })
})
