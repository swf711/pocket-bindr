import { describe, it, expect } from 'vitest'
import { binderCreateSchema } from '@/lib/schemas/binder'
import { DEFAULT_COVER_COLOR } from '@/lib/cover-colors'

describe('binderCreateSchema', () => {
  const base = { gridType: 'grid_3x3' as const }

  it('rejects empty name with BINDER_NAME_REQUIRED', () => {
    const result = binderCreateSchema.safeParse({ ...base, name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain('BINDER_NAME_REQUIRED')
    }
  })

  it('rejects name > 50 chars with BINDER_NAME_TOO_LONG', () => {
    const result = binderCreateSchema.safeParse({ ...base, name: 'a'.repeat(51) })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain('BINDER_NAME_TOO_LONG')
    }
  })

  it('rejects non-hex coverColor with COVER_COLOR_INVALID', () => {
    const result = binderCreateSchema.safeParse({ ...base, name: 'My Binder', coverColor: 'not-a-color' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain('COVER_COLOR_INVALID')
    }
  })

  it('defaults coverColor when not given', () => {
    const result = binderCreateSchema.safeParse({ ...base, name: 'My Binder' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.coverColor).toBe(DEFAULT_COVER_COLOR)
    }
  })

  it('rejects description > 150 chars with DESCRIPTION_TOO_LONG', () => {
    const result = binderCreateSchema.safeParse({ ...base, name: 'My Binder', description: 'a'.repeat(151) })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain('DESCRIPTION_TOO_LONG')
    }
  })

  it('transforms empty description to null', () => {
    const result = binderCreateSchema.safeParse({ ...base, name: 'My Binder', description: '   ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBeNull()
    }
  })

  it('rejects invalid gridType with GRID_TYPE_INVALID', () => {
    const result = binderCreateSchema.safeParse({ name: 'My Binder', gridType: 'grid_9x9' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain('GRID_TYPE_INVALID')
    }
  })
})
