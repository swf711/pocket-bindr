import { describe, it, expect } from 'vitest'
import { objectKeyFor, planSync, assertSafeRemoval } from '../sync'

describe('objectKeyFor', () => {
  it('組出解碼後的 {game}/{language}/{externalId}，無副檔名', () => {
    expect(objectKeyFor({ game: 'PTCG', language: 'EN', externalId: 'sv3-25' })).toBe('ptcg/en/sv3-25')
  })

  it('externalId 含特殊字元（ex10-!）不做 encode，維持解碼後原樣', () => {
    expect(objectKeyFor({ game: 'PTCG', language: 'EN', externalId: 'ex10-!' })).toBe('ptcg/en/ex10-!')
  })

  it('OPCG ZH_TW alias 卡回自己的 key', () => {
    expect(objectKeyFor({ game: 'OPCG', language: 'ZH_TW', externalId: 'OP01-001' })).toBe('opcg/zh-tw/OP01-001')
  })
})

describe('planSync', () => {
  it('只上傳 md5 不同者', () => {
    const local = new Map([
      ['a', 'md5-a'],
      ['b', 'md5-b-new'],
      ['c', 'md5-c'],
    ])
    const remote = new Map([
      ['a', '"md5-a"'],
      ['b', '"md5-b-old"'],
    ])
    const plan = planSync(local, remote)
    expect(plan.upload.sort()).toEqual(['b', 'c'])
  })

  it('列出孤兒 key（remote 有、local 沒有）', () => {
    const local = new Map([['a', 'md5-a']])
    const remote = new Map([
      ['a', '"md5-a"'],
      ['orphan', '"whatever"'],
    ])
    const plan = planSync(local, remote)
    expect(plan.remove).toEqual(['orphan'])
    expect(plan.upload).toEqual([])
  })

  it('ETag 帶引號時仍正確比對', () => {
    const local = new Map([['a', 'abc123']])
    const remote = new Map([['a', '"abc123"']])
    expect(planSync(local, remote).upload).toEqual([])
  })
})

describe('assertSafeRemoval', () => {
  it('刪除量在 max(50, 1%) 以內時不 throw', () => {
    expect(() => assertSafeRemoval(Array.from({ length: 40 }, (_, i) => `k${i}`), 1000)).not.toThrow()
  })

  it('刪除量超過 max(50, 1%) 時 throw', () => {
    expect(() => assertSafeRemoval(Array.from({ length: 60 }, (_, i) => `k${i}`), 1000)).toThrow()
  })

  it('total 夠大時上限改採 1%（非固定 50）', () => {
    // total=100000 → 1% = 1000 > 50，刪 800 個不應 throw
    expect(() => assertSafeRemoval(Array.from({ length: 800 }, (_, i) => `k${i}`), 100_000)).not.toThrow()
    expect(() => assertSafeRemoval(Array.from({ length: 1001 }, (_, i) => `k${i}`), 100_000)).toThrow()
  })
})
