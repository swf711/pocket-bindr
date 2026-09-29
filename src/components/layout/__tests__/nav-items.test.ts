import { describe, it, expect } from 'vitest'
import { NAV_ITEMS } from '../nav-items'

describe('NAV_ITEMS', () => {
  it('首頁項目 prefetch 為 false（header 全站常駐必在 viewport 內，ISR 化後預設預抓會對每頁觸發多個 segment 請求）', () => {
    const home = NAV_ITEMS.find((item) => item.href === '/')
    expect(home?.prefetch).toBe(false)
  })

  it('其餘項目未指定 prefetch（沿用 next/link 預設）', () => {
    const others = NAV_ITEMS.filter((item) => item.href !== '/')
    expect(others.length).toBeGreaterThan(0)
    for (const item of others) {
      expect(item.prefetch).toBeUndefined()
    }
  })
})
