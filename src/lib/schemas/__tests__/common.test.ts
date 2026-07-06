import { describe, it, expect } from 'vitest'
import { gridTypeSchema, hexColorSchema, passwordSchema, GRID_TYPE_VALUES } from '@/lib/schemas/common'

describe('gridTypeSchema', () => {
  it('accepts all known grid types', () => {
    for (const v of GRID_TYPE_VALUES) {
      expect(gridTypeSchema.safeParse(v).success).toBe(true)
    }
  })

  it('rejects unknown grid type with GRID_TYPE_INVALID', () => {
    const result = gridTypeSchema.safeParse('grid_9x9')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('GRID_TYPE_INVALID')
    }
  })
})

describe('hexColorSchema', () => {
  it('accepts a valid hex color', () => {
    expect(hexColorSchema.safeParse('#4A5568').success).toBe(true)
  })

  it('rejects an invalid hex color with COVER_COLOR_INVALID', () => {
    const result = hexColorSchema.safeParse('blue')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('COVER_COLOR_INVALID')
    }
  })
})

describe('passwordSchema', () => {
  it('accepts a password with >= 8 chars', () => {
    expect(passwordSchema.safeParse('password123').success).toBe(true)
  })

  it('rejects a password with < 8 chars with PASSWORD_TOO_SHORT', () => {
    const result = passwordSchema.safeParse('short')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('PASSWORD_TOO_SHORT')
    }
  })
})
