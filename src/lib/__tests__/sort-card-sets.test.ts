import { describe, it, expect } from 'vitest'
import { sortSetsWithinGroup, groupAndSortSets, RawSetForSort } from '../sort-card-sets'

describe('sortSetsWithinGroup', () => {
  it('有 releaseDate 者依日期由新到舊', () => {
    const sets = [
      { externalId: 'A', releaseDate: '2023-01-01' },
      { externalId: 'B', releaseDate: '2024-01-01' },
      { externalId: 'C', releaseDate: '2023-06-01' },
    ]
    const sorted = sortSetsWithinGroup(sets)
    expect(sorted.map(s => s.externalId)).toEqual(['B', 'C', 'A'])
  })

  it('releaseDate 為 null 者排在有日期者之後', () => {
    const sets = [
      { externalId: 'X', releaseDate: null },
      { externalId: 'Y', releaseDate: '2024-01-01' },
    ]
    const sorted = sortSetsWithinGroup(sets)
    expect(sorted.map(s => s.externalId)).toEqual(['Y', 'X'])
  })

  it('多個 null 之間以 externalId 降冪排序', () => {
    const sets = [
      { externalId: 'OP01', releaseDate: null },
      { externalId: 'OP10', releaseDate: null },
      { externalId: 'OP05', releaseDate: null },
    ]
    const sorted = sortSetsWithinGroup(sets)
    expect(sorted.map(s => s.externalId)).toEqual(['OP10', 'OP05', 'OP01'])
  })

  it('接受 Date 物件作為 releaseDate', () => {
    const sets = [
      { externalId: 'A', releaseDate: new Date('2022-01-01') },
      { externalId: 'B', releaseDate: new Date('2023-01-01') },
    ]
    const sorted = sortSetsWithinGroup(sets)
    expect(sorted.map(s => s.externalId)).toEqual(['B', 'A'])
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
})
