import { describe, it, expect } from 'vitest'
import { resolvePtcgSetCodeCandidates } from '../ptcg-set-code-aliases'
import { PTCG_EN_PTCGO_CODE_ALIASES } from '../ptcg-en-ptcgo-aliases.generated'

describe('resolvePtcgSetCodeCandidates — PTCG ZH_TW（剝尾 F 區域後綴）', () => {
  it('M5F → [m5, m5f]（卡面 M5F、DB externalId M5；保留原碼）', () => {
    expect(resolvePtcgSetCodeCandidates('M5F', 'PTCG', 'ZH_TW')).toEqual(['m5', 'm5f'])
  })

  it('sv8F → [sv8, sv8f]', () => {
    expect(resolvePtcgSetCodeCandidates('sv8F', 'PTCG', 'ZH_TW')).toEqual(['sv8', 'sv8f'])
  })

  it('svFF（真實 set SVF 的繁中卡面）→ [svf, svff]', () => {
    expect(resolvePtcgSetCodeCandidates('svFF', 'PTCG', 'ZH_TW')).toEqual(['svf', 'svff'])
  })

  it('svf（使用者直接輸入真實 set code）→ [sv, svf]，原碼 svf 仍在候選故不漏搜', () => {
    expect(resolvePtcgSetCodeCandidates('svf', 'PTCG', 'ZH_TW')).toEqual(['sv', 'svf'])
  })

  it('太陽月亮世代 AS5a（不以 f 結尾）→ [as5a]，剝尾規則天然 no-op', () => {
    expect(resolvePtcgSetCodeCandidates('AS5a', 'PTCG', 'ZH_TW')).toEqual(['as5a'])
  })

  it('不以 f 結尾者原樣回傳（m5 → [m5]）', () => {
    expect(resolvePtcgSetCodeCandidates('m5', 'PTCG', 'ZH_TW')).toEqual(['m5'])
  })
})

describe('resolvePtcgSetCodeCandidates — PTCG EN（ptcgoCode 縮寫對照）', () => {
  it('obf（卡面縮寫）→ [sv3]（Obsidian Flames）', () => {
    expect(resolvePtcgSetCodeCandidates('OBF', 'PTCG', 'EN')).toEqual(['sv3'])
  })

  it('一碼對多候選（主 set + Trainer Gallery）：asr → 含 swsh10 與 swsh10tg', () => {
    expect(resolvePtcgSetCodeCandidates('ASR', 'PTCG', 'EN')).toEqual(
      expect.arrayContaining(['swsh10', 'swsh10tg']),
    )
  })

  it('未列縮寫／直接輸入 id（sv3）→ [sv3] 原樣', () => {
    expect(resolvePtcgSetCodeCandidates('sv3', 'PTCG', 'EN')).toEqual(['sv3'])
  })
})

describe('resolvePtcgSetCodeCandidates — 白名單/範圍防護', () => {
  it('PTCG JA：卡面碼 = externalId，一律原碼（M5F 不剝、SVF 不動）', () => {
    expect(resolvePtcgSetCodeCandidates('M5F', 'PTCG', 'JA')).toEqual(['m5f'])
    expect(resolvePtcgSetCodeCandidates('SVF', 'PTCG', 'JA')).toEqual(['svf'])
    // JA 同時有真實 XYF 與 XY 兩 set，若誤剝 F 會把 XYF 撈成 XY —— 確認不剝
    expect(resolvePtcgSetCodeCandidates('XYF', 'PTCG', 'JA')).toEqual(['xyf'])
  })

  it('非 PTCG（OPCG）：不套任何規則，一律原碼', () => {
    expect(resolvePtcgSetCodeCandidates('op16', 'OPCG', 'ZH_TW')).toEqual(['op16'])
    expect(resolvePtcgSetCodeCandidates('obf', 'OPCG', 'EN')).toEqual(['obf'])
  })

  it('無 game/language（預設）：原碼', () => {
    expect(resolvePtcgSetCodeCandidates('M5F')).toEqual(['m5f'])
  })
})

describe('PTCG_EN_PTCGO_CODE_ALIASES 不變式', () => {
  it('key 皆 lowercase、value 皆非空 lowercase 陣列、且無自映射（縮寫 ≠ id）', () => {
    for (const [key, ids] of Object.entries(PTCG_EN_PTCGO_CODE_ALIASES)) {
      expect(key).toBe(key.toLowerCase())
      expect(Array.isArray(ids)).toBe(true)
      expect(ids.length).toBeGreaterThan(0)
      for (const id of ids) {
        expect(id).toBe(id.toLowerCase())
        expect(id).not.toBe(key)
      }
    }
  })
})
