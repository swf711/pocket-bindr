import { describe, it, expect } from 'vitest'
import { resolveSpanLayout, sourceCellForIndex, type SpanLayout } from '../multi-card-layout'

// 實際 DB 值（2026-07-28 全庫盤點，23 列複數卡）
const LEGEND = { cardNumber: '015/070・016/070', supertype: 'Pokémon' }
const M6_STADIUM = { cardNumber: '071/076・072/076', supertype: 'Trainer' }
const V_UNION_JA = { cardNumber: '025/028・026/028・027/028・028/028', supertype: 'Pokémon' }
const V_UNION_ZHTW = { cardNumber: '001/013・002/013・003/013・004/013', supertype: 'Pokémon' }
const SINGLE = { cardNumber: '007/076', supertype: 'Pokémon' }

describe('resolveSpanLayout', () => {
  it('V-UNION（四成分）→ 2×2，不旋轉', () => {
    expect(resolveSpanLayout(V_UNION_JA)).toEqual({
      cols: 2,
      rows: 2,
      sourceCols: 2,
      sourceRows: 2,
      rotation: 0,
    })
  })

  it('ZH_TW V-UNION 與 JA 同樣判定（語言無關）', () => {
    expect(resolveSpanLayout(V_UNION_ZHTW)).toEqual(resolveSpanLayout(V_UNION_JA))
  })

  it('M6 スタジアム（兩成分 + Trainer）→ 左右兩格，原圖左右切，不旋轉', () => {
    expect(resolveSpanLayout(M6_STADIUM)).toEqual({
      cols: 2,
      rows: 1,
      sourceCols: 2,
      sourceRows: 1,
      rotation: 0,
    })
  })

  it('LEGEND（兩成分 + 非 Trainer）→ 左右兩格，原圖上下切，逆時針 90°', () => {
    expect(resolveSpanLayout(LEGEND)).toEqual({
      cols: 2,
      rows: 1,
      sourceCols: 1,
      sourceRows: 2,
      rotation: 270,
    })
  })

  it('JA 舊世代 supertype 為空字串時仍走 LEGEND 分支', () => {
    expect(resolveSpanLayout({ cardNumber: '029/070・030/070', supertype: '' })?.rotation).toBe(270)
  })

  it('單一卡號 / 空卡號 / null 一律回 null', () => {
    expect(resolveSpanLayout(SINGLE)).toBeNull()
    expect(resolveSpanLayout({ cardNumber: '', supertype: 'Pokémon' })).toBeNull()
    expect(resolveSpanLayout({ cardNumber: null, supertype: null })).toBeNull()
  })

  it('每個顯示格的區塊比例都接近標準卡 0.716（跨格幾何的前提）', () => {
    // 合成圖實測尺寸 → 單一區塊 aspect
    const cases: [SpanLayout, number, number][] = [
      [resolveSpanLayout(LEGEND)!, 480, 687], // 區塊 480×343.5，旋轉後 343.5×480
      [resolveSpanLayout(M6_STADIUM)!, 868, 606], // 區塊 434×606
      [resolveSpanLayout(V_UNION_JA)!, 1200, 1670], // 區塊 600×835
    ]
    for (const [layout, w, h] of cases) {
      const cellW = w / layout.sourceCols
      const cellH = h / layout.sourceRows
      // 旋轉 90/270 時長寬互換才是最終顯示比例
      const aspect = layout.rotation % 180 === 0 ? cellW / cellH : cellH / cellW
      expect(aspect).toBeCloseTo(63 / 88, 2)
    }
  })
})

describe('sourceCellForIndex', () => {
  it('V-UNION 2×2 為單純 row-major', () => {
    const layout = resolveSpanLayout(V_UNION_JA)!
    expect(sourceCellForIndex(layout, 0)).toEqual({ row: 0, col: 0 })
    expect(sourceCellForIndex(layout, 1)).toEqual({ row: 0, col: 1 })
    expect(sourceCellForIndex(layout, 2)).toEqual({ row: 1, col: 0 })
    expect(sourceCellForIndex(layout, 3)).toEqual({ row: 1, col: 1 })
  })

  it('M6 左右兩格直接對應原圖左右', () => {
    const layout = resolveSpanLayout(M6_STADIUM)!
    expect(sourceCellForIndex(layout, 0)).toEqual({ row: 0, col: 0 })
    expect(sourceCellForIndex(layout, 1)).toEqual({ row: 0, col: 1 })
  })

  it('LEGEND 左格取原圖上半、右格取原圖下半（卡號 015 在左）', () => {
    const layout = resolveSpanLayout(LEGEND)!
    expect(sourceCellForIndex(layout, 0)).toEqual({ row: 0, col: 0 })
    expect(sourceCellForIndex(layout, 1)).toEqual({ row: 1, col: 0 })
  })
})
