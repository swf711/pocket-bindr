import { describe, it, expect } from 'vitest'
import { resolveProviderEmailVerified } from '@/lib/oauth-email-verified'

describe('resolveProviderEmailVerified', () => {
  describe('google（OIDC email_verified）', () => {
    it('email_verified 為 true → 蓋章', () => {
      expect(resolveProviderEmailVerified('google', { email_verified: true })).toBe(true)
    })

    it('email_verified 為 false → 不蓋章', () => {
      expect(resolveProviderEmailVerified('google', { email_verified: false })).toBe(false)
    })

    it('缺少 email_verified 欄位 → 不蓋章（不因有 email 就推定已驗證）', () => {
      expect(resolveProviderEmailVerified('google', { email: 'a@b.com' })).toBe(false)
    })

    it('email_verified 為字串 "true" → 不蓋章（嚴格比對，不吃 truthy）', () => {
      expect(resolveProviderEmailVerified('google', { email_verified: 'true' })).toBe(false)
    })

    it('誤用 discord 的 verified 欄位 → 不蓋章', () => {
      expect(resolveProviderEmailVerified('google', { verified: true })).toBe(false)
    })
  })

  describe('discord（verified）', () => {
    it('verified 為 true → 蓋章', () => {
      expect(resolveProviderEmailVerified('discord', { verified: true })).toBe(true)
    })

    it('verified 為 false → 不蓋章（Discord 允許未驗證 email 帳號存在）', () => {
      expect(resolveProviderEmailVerified('discord', { verified: false })).toBe(false)
    })

    it('有 email 但無 verified → 不蓋章', () => {
      expect(resolveProviderEmailVerified('discord', { email: 'a@b.com' })).toBe(false)
    })

    it('誤用 google 的 email_verified 欄位 → 不蓋章', () => {
      expect(resolveProviderEmailVerified('discord', { email_verified: true })).toBe(false)
    })
  })

  describe('其他情況一律不蓋章', () => {
    it('未知 provider（即使旗標為 true）', () => {
      expect(resolveProviderEmailVerified('github', { email_verified: true, verified: true })).toBe(false)
    })

    it('credentials provider', () => {
      expect(resolveProviderEmailVerified('credentials', { email_verified: true })).toBe(false)
    })

    it('provider 為 undefined', () => {
      expect(resolveProviderEmailVerified(undefined, { email_verified: true })).toBe(false)
    })

    it('provider 為 null', () => {
      expect(resolveProviderEmailVerified(null, { email_verified: true })).toBe(false)
    })

    it('profile 為 undefined', () => {
      expect(resolveProviderEmailVerified('google', undefined)).toBe(false)
    })

    it('profile 為 null', () => {
      expect(resolveProviderEmailVerified('google', null)).toBe(false)
    })

    it('profile 為空物件', () => {
      expect(resolveProviderEmailVerified('google', {})).toBe(false)
    })
  })
})
