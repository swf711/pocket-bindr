import { describe, it, expect } from 'vitest'
import {
  CARD_NUMBER_SEPARATOR,
  extractCardNumbers,
  formatCardNumbers,
  isMultiNumberCard,
  splitCardNumber,
} from '../card-number'

// 官網 detail 頁 `.subtext` 的原始 textContent（`&nbsp;` =  ）。
// 三種 markup 皆為實抓（2026-07-28）：一般卡直接文字節點、LEGEND 兩組號碼以 <br> 分行、
// M6 スタジアム 包在 .subtext-list、V-UNION 再包一層 .subtext-set。
const JA_SINGLE = '\n 007 / 076 \n'
const JA_LEGEND = '\n 015 / 070  \n  (上)\n 016 / 070  \n  (下)\n'
const JA_M6_STADIUM = '\n 071 / 076\n \n  (左)\n 072 / 076 \n  (右)\n'
const JA_V_UNION =
  '\n 025 / 028\n \n  (左上)\n' +
  ' 026 / 028\n \n  (右上)\n' +
  ' 027 / 028\n \n  (左下)\n' +
  ' 028 / 028 \n  (右下)\n'
const JA_PROMO = '\n 001 / SV-P \n'

describe('extractCardNumbers', () => {
  it('單號卡抽出單一成分（既有 20k+ 卡的零回歸保證）', () => {
    expect(extractCardNumbers(JA_SINGLE)).toEqual(['007/076'])
  })

  it('LEGEND：兩組號碼皆抽出，(上)(下) 位置標記丟棄', () => {
    expect(extractCardNumbers(JA_LEGEND)).toEqual(['015/070', '016/070'])
  })

  it('M6 スタジアム：.subtext-list 內兩組號碼皆抽出', () => {
    expect(extractCardNumbers(JA_M6_STADIUM)).toEqual(['071/076', '072/076'])
  })

  it('V-UNION：.subtext-set 內四組號碼皆抽出', () => {
    expect(extractCardNumbers(JA_V_UNION)).toEqual(['025/028', '026/028', '027/028', '028/028'])
  })

  it('促銷卡的非數字分母（SV-P）不可被漏抽', () => {
    expect(extractCardNumbers(JA_PROMO)).toEqual(['001/SV-P'])
  })

  it('無號碼時回空陣列（DP 世代 authentic 無收集號）', () => {
    expect(extractCardNumbers('\n  \n')).toEqual([])
  })

  it('重複出現的號碼去重保序', () => {
    expect(extractCardNumbers('001/013 001/013 002/013')).toEqual(['001/013', '002/013'])
  })

  it('⚠️ 已剝除空白的串接形不受支援：分母會誤吃下一個分子', () => {
    // 契約鎖定——呼叫端必須餵未剝空白的原始文字。ZH_TW 爬蟲曾先 replace(/\s/g,'') 才解析，
    // 正是 `001/013002/013…` 這類壞值的成因。
    expect(extractCardNumbers('001/013002/013')).not.toEqual(['001/013', '002/013'])
  })
})

describe('formatCardNumbers', () => {
  it('單一成分輸出與成分逐字元相同', () => {
    expect(formatCardNumbers(['007/076'])).toBe('007/076')
  })

  it('多成分以 ・ 連接', () => {
    expect(formatCardNumbers(['071/076', '072/076'])).toBe('071/076・072/076')
  })

  it('空陣列輸出空字串（沿用「空字串＝無卡號」語意）', () => {
    expect(formatCardNumbers([])).toBe('')
  })

  it('extract → format 對單號卡是恆等變換', () => {
    expect(formatCardNumbers(extractCardNumbers(JA_SINGLE))).toBe('007/076')
  })
})

describe('splitCardNumber', () => {
  it('單號卡回單一成分', () => {
    expect(splitCardNumber('007/076')).toEqual(['007/076'])
  })

  it('多號卡依分隔符拆解', () => {
    expect(splitCardNumber('025/028・026/028・027/028・028/028')).toEqual([
      '025/028',
      '026/028',
      '027/028',
      '028/028',
    ])
  })

  it('空字串／null／undefined 皆回空陣列', () => {
    expect(splitCardNumber('')).toEqual([])
    expect(splitCardNumber(null)).toEqual([])
    expect(splitCardNumber(undefined)).toEqual([])
  })

  it('EN 的裸號與含連字號卡號不受影響', () => {
    expect(splitCardNumber('SWSH159')).toEqual(['SWSH159'])
    expect(splitCardNumber('OP16-001')).toEqual(['OP16-001'])
  })
})

describe('isMultiNumberCard', () => {
  it('多號卡為 true', () => {
    expect(isMultiNumberCard('071/076・072/076')).toBe(true)
  })

  it('單號卡與無卡號為 false', () => {
    expect(isMultiNumberCard('007/076')).toBe(false)
    expect(isMultiNumberCard('')).toBe(false)
    expect(isMultiNumberCard(null)).toBe(false)
  })
})

describe('CARD_NUMBER_SEPARATOR', () => {
  it('分隔符不可與卡號本身可能出現的字元衝突', () => {
    // 卡號成分只會出現數字／英文字母／`/`／`-`（EN 的 OP16-001、JA 的 001/SV-P）。
    expect(CARD_NUMBER_SEPARATOR).toBe('・')
    expect(/[A-Za-z0-9/-]/.test(CARD_NUMBER_SEPARATOR)).toBe(false)
  })
})
