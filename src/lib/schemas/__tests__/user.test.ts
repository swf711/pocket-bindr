import { describe, it, expect } from 'vitest'
import { usernameSchema, setPasswordSchema, changePasswordSchema } from '@/lib/schemas/user'

describe('usernameSchema', () => {
  it('accepts a valid username', () => {
    expect(usernameSchema.safeParse('brian_shao-99').success).toBe(true)
  })

  it('rejects a username that does not match the pattern with USERNAME_INVALID', () => {
    const result = usernameSchema.safeParse('a')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('USERNAME_INVALID')
    }
  })

  it('rejects usernames with illegal characters', () => {
    const result = usernameSchema.safeParse('has space!')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('USERNAME_INVALID')
    }
  })
})

describe('setPasswordSchema', () => {
  it('rejects password < 8 chars with PASSWORD_TOO_SHORT', () => {
    const result = setPasswordSchema.safeParse({ newPassword: 'short' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('PASSWORD_TOO_SHORT')
    }
  })
})

describe('changePasswordSchema', () => {
  it('accepts valid currentPassword + newPassword', () => {
    expect(
      changePasswordSchema.safeParse({ currentPassword: 'old-password', newPassword: 'new-password-123' }).success,
    ).toBe(true)
  })

  it('rejects newPassword < 8 chars with PASSWORD_TOO_SHORT', () => {
    const result = changePasswordSchema.safeParse({ currentPassword: 'old-password', newPassword: 'short' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain('PASSWORD_TOO_SHORT')
    }
  })
})
