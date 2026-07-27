import { describe, it, expect } from 'vitest'
import { hasCardNumber, formatCardSetLabel } from '../card-display'

describe('hasCardNumber', () => {
  it('有值時為 true', () => {
    expect(hasCardNumber('054')).toBe(true)
  })

  it('空字串為 false（PTCG JA DP 世代的 authentic 空值）', () => {
    expect(hasCardNumber('')).toBe(false)
  })

  it('null / undefined 為 false', () => {
    expect(hasCardNumber(null)).toBe(false)
    expect(hasCardNumber(undefined)).toBe(false)
  })

  it('純空白視為無值', () => {
    expect(hasCardNumber('   ')).toBe(false)
  })
})

describe('formatCardSetLabel', () => {
  it('有卡號時回「系列碼 卡號」', () => {
    expect(formatCardSetLabel({ set: { externalId: 'sv3' }, cardNumber: '054' })).toBe('sv3 054')
  })

  it('無卡號時只回系列碼，不留尾空格', () => {
    expect(formatCardSetLabel({ set: { externalId: 'ja-DP-P' }, cardNumber: '' })).toBe('ja-DP-P')
  })

  it('null 卡號同樣不留尾空格', () => {
    expect(formatCardSetLabel({ set: { externalId: 'ja-DP-P' }, cardNumber: null })).toBe('ja-DP-P')
  })
})
