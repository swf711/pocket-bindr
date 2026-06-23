import { describe, it, expect } from 'vitest'
import { generateShareToken } from '../share-token'

describe('generateShareToken', () => {
  it('回傳 32 字元十六進位字串', () => {
    const token = generateShareToken()
    expect(token).toHaveLength(32)
    expect(/^[0-9a-f]{32}$/.test(token)).toBe(true)
  })

  it('每次產生不同的 token', () => {
    const tokens = new Set(Array.from({ length: 20 }, () => generateShareToken()))
    expect(tokens.size).toBe(20)
  })
})
