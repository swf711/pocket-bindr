import { describe, it, expect } from 'vitest'
import { reportSchema } from '@/lib/schemas/report'

describe('reportSchema', () => {
  it('accepts a valid type + message without cardContext', () => {
    const result = reportSchema.safeParse({ type: 'bug', message: 'This is a valid bug report.' })
    expect(result.success).toBe(true)
  })

  it('accepts a valid payload with cardContext', () => {
    const result = reportSchema.safeParse({
      type: 'missing_card',
      message: 'This card seems to be missing from the set.',
      cardContext: {
        cardId: 'card-1',
        cardName: 'Pikachu',
        setExternalId: 'base1',
        cardNumber: '25',
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects an unknown type with REPORT_TYPE_INVALID', () => {
    const result = reportSchema.safeParse({ type: 'not_a_type', message: 'A valid length message here.' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('REPORT_TYPE_INVALID')
    }
  })

  it('rejects a message shorter than 10 chars with REPORT_MESSAGE_TOO_SHORT', () => {
    const result = reportSchema.safeParse({ type: 'bug', message: 'short' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('REPORT_MESSAGE_TOO_SHORT')
    }
  })

  it('rejects a message longer than 2000 chars with REPORT_MESSAGE_TOO_LONG', () => {
    const result = reportSchema.safeParse({ type: 'bug', message: 'a'.repeat(2001) })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('REPORT_MESSAGE_TOO_LONG')
    }
  })
})
