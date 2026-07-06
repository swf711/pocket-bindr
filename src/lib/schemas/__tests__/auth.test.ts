import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/schemas/auth'

describe('registerSchema', () => {
  const valid = { email: 'a@example.com', username: 'brian_shao', password: 'password123' }

  it('accepts valid input', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects missing fields with INVALID_INPUT', () => {
    const result = registerSchema.safeParse({ email: '', username: '', password: '' })
    expect(result.success).toBe(false)
  })

  it('rejects malformed email with INVALID_INPUT', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'not-an-email' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) => i.path[0] === 'email')
      expect(emailIssue?.message).toBe('INVALID_INPUT')
    }
  })

  it('rejects weak password with PASSWORD_TOO_SHORT', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'short' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const pwIssue = result.error.issues.find((i) => i.path[0] === 'password')
      expect(pwIssue?.message).toBe('PASSWORD_TOO_SHORT')
    }
  })

  it('rejects invalid username with USERNAME_INVALID', () => {
    const result = registerSchema.safeParse({ ...valid, username: 'a' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const userIssue = result.error.issues.find((i) => i.path[0] === 'username')
      expect(userIssue?.message).toBe('USERNAME_INVALID')
    }
  })
})

describe('loginSchema', () => {
  it('accepts valid input', () => {
    expect(loginSchema.safeParse({ email: 'a@example.com', password: 'x' }).success).toBe(true)
  })

  it('rejects malformed email', () => {
    expect(loginSchema.safeParse({ email: 'nope', password: 'x' }).success).toBe(false)
  })
})

describe('forgotPasswordSchema', () => {
  it('rejects malformed email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('rejects weak password with PASSWORD_TOO_SHORT', () => {
    const result = resetPasswordSchema.safeParse({ token: 'abc', newPassword: 'short' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain('PASSWORD_TOO_SHORT')
    }
  })
})
