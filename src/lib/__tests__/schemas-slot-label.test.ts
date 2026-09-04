import { describe, it, expect } from 'vitest'
import { slotLabelsSchema } from '@/lib/schemas/binder'
import { MAX_SLOT_LABELS, MAX_SLOT_LABEL_LENGTH } from '@/lib/binder-limits'

describe('slotLabelsSchema', () => {
  it('每個標籤前後空白被 trim', () => {
    expect(slotLabelsSchema.parse({ labels: ['  No.025  ', ' SR '] })).toEqual({
      labels: ['No.025', 'SR'],
    })
  })

  it('trim 後為空字串的項目被濾掉', () => {
    expect(slotLabelsSchema.parse({ labels: ['No.025', '   ', ''] })).toEqual({
      labels: ['No.025'],
    })
  })

  it('重複的標籤只留首見一個', () => {
    expect(slotLabelsSchema.parse({ labels: ['SR', ' SR ', 'RR'] })).toEqual({
      labels: ['SR', 'RR'],
    })
  })

  it('空陣列合法（＝清除全部標籤）', () => {
    expect(slotLabelsSchema.parse({ labels: [] })).toEqual({ labels: [] })
  })

  it('數量上限通過、超過一個失敗', () => {
    const atLimit = Array.from({ length: MAX_SLOT_LABELS }, (_, i) => `t${i}`)
    expect(slotLabelsSchema.safeParse({ labels: atLimit }).success).toBe(true)

    const over = slotLabelsSchema.safeParse({
      labels: Array.from({ length: MAX_SLOT_LABELS + 1 }, (_, i) => `t${i}`),
    })
    expect(over.success).toBe(false)
    expect(over.error?.issues[0]?.message).toBe('SLOT_LABELS_TOO_MANY')
  })

  it('去重後才算數量（重複項不佔額度）', () => {
    const dupes = Array.from({ length: MAX_SLOT_LABELS + 2 }, () => 'same')
    expect(slotLabelsSchema.parse({ labels: dupes })).toEqual({ labels: ['same'] })
  })

  it('單一標籤字數上限通過、超過一字失敗', () => {
    const atLimit = 'a'.repeat(MAX_SLOT_LABEL_LENGTH)
    expect(slotLabelsSchema.safeParse({ labels: [atLimit] }).success).toBe(true)

    const over = slotLabelsSchema.safeParse({ labels: ['a'.repeat(MAX_SLOT_LABEL_LENGTH + 1)] })
    expect(over.success).toBe(false)
    expect(over.error?.issues[0]?.message).toBe('SLOT_LABEL_TOO_LONG')
  })

  it('長度以 trim 後計算（前後空白不佔額度）', () => {
    const padded = `  ${'a'.repeat(MAX_SLOT_LABEL_LENGTH)}  `
    expect(slotLabelsSchema.safeParse({ labels: [padded] }).success).toBe(true)
  })
})
