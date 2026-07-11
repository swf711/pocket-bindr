import { describe, it, expect } from 'vitest'
import { sortSetsWithinGroup, groupAndSortSets, isPromoSet, RawSetForSort } from '../sort-card-sets'

describe('isPromoSet', () => {
  it('EN "Black Star Promos" 命中', () => {
    expect(isPromoSet('SWSH Black Star Promos')).toBe(true)
  })

  it('JA "プロモカード" 命中', () => {
    expect(isPromoSet('ポケモンカードゲームスカーレット＆バイオレット プロモカード')).toBe(true)
  })

  it('ZH_TW "特典卡" 命中', () => {
    expect(isPromoSet('特典卡 劍&盾')).toBe(true)
  })

  it('一般擴充包名稱不命中', () => {
    expect(isPromoSet('擴充包「黯焰支配者」')).toBe(false)
  })
})

describe('sortSetsWithinGroup', () => {
  it('有 releaseDate 者依日期由新到舊', () => {
    const sets = [
      { name: 'A', externalId: 'A', releaseDate: '2023-01-01' },
      { name: 'B', externalId: 'B', releaseDate: '2024-01-01' },
      { name: 'C', externalId: 'C', releaseDate: '2023-06-01' },
    ]
    const sorted = sortSetsWithinGroup(sets)
    expect(sorted.map(s => s.externalId)).toEqual(['B', 'C', 'A'])
  })

  it('releaseDate 為 null 者排在有日期者之後', () => {
    const sets = [
      { name: 'X', externalId: 'X', releaseDate: null },
      { name: 'Y', externalId: 'Y', releaseDate: '2024-01-01' },
    ]
    const sorted = sortSetsWithinGroup(sets)
    expect(sorted.map(s => s.externalId)).toEqual(['Y', 'X'])
  })

  it('多個 null 之間以 externalId 降冪排序', () => {
    const sets = [
      { name: 'Set OP01', externalId: 'OP01', releaseDate: null },
      { name: 'Set OP10', externalId: 'OP10', releaseDate: null },
      { name: 'Set OP05', externalId: 'OP05', releaseDate: null },
    ]
    const sorted = sortSetsWithinGroup(sets)
    expect(sorted.map(s => s.externalId)).toEqual(['OP10', 'OP05', 'OP01'])
  })

  it('接受 Date 物件作為 releaseDate', () => {
    const sets = [
      { name: 'A', externalId: 'A', releaseDate: new Date('2022-01-01') },
      { name: 'B', externalId: 'B', releaseDate: new Date('2023-01-01') },
    ]
    const sorted = sortSetsWithinGroup(sets)
    expect(sorted.map(s => s.externalId)).toEqual(['B', 'A'])
  })

  it('促銷卡（名稱含 特典/プロモ/promo）釘在系列最後，不論日期', () => {
    const sets = [
      { name: '特典卡 劍&盾', externalId: 'S-P', releaseDate: '2022-12-15' },
      { name: '擴充包「星星誕生」', externalId: 'S9', releaseDate: '2022-01-28' },
      { name: '擴充包「思維激盪」', externalId: 'S12', releaseDate: '2022-11-04' },
    ]
    const sorted = sortSetsWithinGroup(sets)
    expect(sorted.map(s => s.externalId)).toEqual(['S12', 'S9', 'S-P'])
  })

  it('同一發售日 → externalId 遞減（ST36→ST31）', () => {
    const sets = [
      { name: '赤 モンキー・D・ルフィ', externalId: 'ST31', releaseDate: '2026-07-11' },
      { name: '緑 ロロノア・ゾロ', externalId: 'ST32', releaseDate: '2026-07-11' },
      { name: '青 クザン', externalId: 'ST33', releaseDate: '2026-07-11' },
      { name: '紫 シャーロット・カタクリ', externalId: 'ST34', releaseDate: '2026-07-11' },
      { name: '赤黒 サボ', externalId: 'ST35', releaseDate: '2026-07-11' },
      { name: '黄 ユースタス・キッド', externalId: 'ST36', releaseDate: '2026-07-11' },
    ]
    const sorted = sortSetsWithinGroup(sets)
    expect(sorted.map(s => s.externalId)).toEqual(['ST36', 'ST35', 'ST34', 'ST33', 'ST32', 'ST31'])
  })

  it('非促銷有日期 → 依日期 desc（維持既有行為）', () => {
    const sets = [
      { name: 'Old', externalId: 'A', releaseDate: '2020-01-01' },
      { name: 'New', externalId: 'B', releaseDate: '2024-01-01' },
    ]
    const sorted = sortSetsWithinGroup(sets)
    expect(sorted.map(s => s.externalId)).toEqual(['B', 'A'])
  })

  it('混合：非促銷[日期desc,null後] → 促銷[日期desc,externalId desc]', () => {
    const sets = [
      { name: '特典卡 A', externalId: 'PA', releaseDate: '2023-01-01' },
      { name: '特典卡 B', externalId: 'PB', releaseDate: null },
      { name: '一般擴充包 有日期', externalId: 'R1', releaseDate: '2024-01-01' },
      { name: '一般擴充包 無日期', externalId: 'R2', releaseDate: null },
    ]
    const sorted = sortSetsWithinGroup(sets)
    expect(sorted.map(s => s.externalId)).toEqual(['R1', 'R2', 'PA', 'PB'])
  })
})

describe('groupAndSortSets', () => {
  const sets: RawSetForSort[] = [
    { id: 's1', name: 'Set 1', series: '舊', externalId: 'A1', releaseDate: '2020-01-01' },
    { id: 's2', name: 'Set 2', series: '新', externalId: 'B1', releaseDate: '2024-01-01' },
    { id: 's3', name: 'Set 3', series: '新', externalId: 'B2', releaseDate: '2023-01-01' },
    { id: 's4', name: 'Set 4', series: '無日期', externalId: 'Z9', releaseDate: null },
  ]

  it('group 間依組內最新 releaseDate 由新到舊', () => {
    const groups = groupAndSortSets(sets)
    expect(groups.map(g => g.series)).toEqual(['新', '舊', '無日期'])
  })

  it('全 null 的 group 排最後', () => {
    const groups = groupAndSortSets(sets)
    expect(groups[groups.length - 1].series).toBe('無日期')
  })

  it('latestRelease 為組內最新有效日期', () => {
    const groups = groupAndSortSets(sets)
    const newGroup = groups.find(g => g.series === '新')!
    expect(newGroup.latestRelease).toBe('2024-01-01')
  })

  it('組內 sets 已排序且欄位齊全（SetSummary 結構）', () => {
    const groups = groupAndSortSets(sets)
    const newGroup = groups.find(g => g.series === '新')!
    expect(newGroup.sets.map(s => s.externalId)).toEqual(['B1', 'B2'])
    expect(newGroup.sets[0]).toEqual({
      id: 's2',
      name: 'Set 2',
      series: '新',
      externalId: 'B1',
      releaseDate: '2024-01-01',
    })
  })

  it('null releaseDate 序列化為 null', () => {
    const groups = groupAndSortSets(sets)
    const g = groups.find(gr => gr.series === '無日期')!
    expect(g.latestRelease).toBeNull()
    expect(g.sets[0].releaseDate).toBeNull()
  })

  it('latestRelease 取自非促銷（促銷釘末尾後第一個非 null 為非促銷）', () => {
    const promoHeavySets: RawSetForSort[] = [
      { id: 'p1', name: '特典卡 朱&紫', series: '朱＆紫', externalId: 'SV-P', releaseDate: '2023-01-26' },
      { id: 'p2', name: '擴充包「對戰搭檔」', series: '朱＆紫', externalId: 'SV9', releaseDate: '2025-02-07' },
    ]
    const groups = groupAndSortSets(promoHeavySets)
    const g = groups.find(gr => gr.series === '朱＆紫')!
    expect(g.latestRelease).toBe('2025-02-07')
    expect(g.sets.map(s => s.externalId)).toEqual(['SV9', 'SV-P'])
  })
})
