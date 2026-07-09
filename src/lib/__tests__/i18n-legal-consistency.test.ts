import { describe, it, expect } from 'vitest'
import zhTW from '../../../messages/zh-TW.json'
import en from '../../../messages/en.json'
import ja from '../../../messages/ja.json'

const locales = { 'zh-TW': zhTW, en, ja } as const

describe('三語 privacy 內容結構一致性', () => {
  it('三語 privacy.sections 段數相等', () => {
    const counts = Object.entries(locales).map(([name, m]) => [name, m.privacy.sections.length])
    const [, first] = counts[0]
    for (const [name, count] of counts) {
      expect(count, `${name} sections 段數應與其他語言一致`).toBe(first)
    }
  })

  it('「利用期間、地區、對象及方式」段的 processor 清單三語長度一致', () => {
    const getProcessorItems = (m: (typeof locales)['zh-TW']) => {
      const section = m.privacy.sections.find(
        (s) => Array.isArray(s.items) && s.items.some((i) => i.includes('Supabase')),
      )
      return section?.items ?? []
    }
    const counts = Object.entries(locales).map(([name, m]) => [name, getProcessorItems(m).length])
    for (const [name, count] of counts) {
      expect(count, `${name} processor 清單長度應為 8`).toBe(8)
    }
  })

  it('三語 privacy.lastUpdated 皆已更新至 2026-07-09', () => {
    for (const [name, m] of Object.entries(locales)) {
      expect(m.privacy.lastUpdated, `${name} privacy.lastUpdated`).toBe('2026-07-09')
    }
  })
})
