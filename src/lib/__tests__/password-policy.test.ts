import { describe, it, expect } from 'vitest'
import { isPasswordValid, getPasswordStrength, MIN_PASSWORD_LENGTH } from '@/lib/password-policy'

describe('isPasswordValid', () => {
  it(`少於 ${MIN_PASSWORD_LENGTH} 字回 false（邊界 7 字）`, () => {
    expect(isPasswordValid('1234567')).toBe(false)
  })

  it(`等於 ${MIN_PASSWORD_LENGTH} 字回 true（邊界 8 字）`, () => {
    expect(isPasswordValid('12345678')).toBe(true)
  })

  it('非字串回 false', () => {
    expect(isPasswordValid(undefined as unknown as string)).toBe(false)
  })
})

describe('getPasswordStrength', () => {
  it('過短回 score 0 / 太短', () => {
    expect(getPasswordStrength('short')).toEqual({ score: 0, label: '太短' })
  })

  it('8 字單一字元類別回 score 1 / 弱', () => {
    expect(getPasswordStrength('password')).toEqual({ score: 1, label: '弱' })
  })

  it('兩種字元類別回 score 2 / 中', () => {
    expect(getPasswordStrength('password1')).toEqual({ score: 2, label: '中' })
  })

  it('三種字元類別回 score 3 / 強', () => {
    expect(getPasswordStrength('Password1')).toEqual({ score: 3, label: '強' })
  })

  it('長密碼（>=12）加分提升強度', () => {
    expect(getPasswordStrength('passwordlong').score).toBe(2)
  })
})
