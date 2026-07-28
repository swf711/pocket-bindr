import { describe, it, expect } from 'vitest'
import { getNaturalSlotWidth, shouldCompactSlotActions } from '../slot-action-fit'

describe('getNaturalSlotWidth', () => {
  it('欄數越多格位越窄', () => {
    expect(getNaturalSlotWidth('grid_3x3')).toBeGreaterThan(getNaturalSlotWidth('grid_4x3'))
    expect(getNaturalSlotWidth('grid_1x2')).toBeGreaterThan(getNaturalSlotWidth('grid_2x2'))
  })

  it('3x3 自然格位寬約 181px', () => {
    expect(getNaturalSlotWidth('grid_3x3')).toBeCloseTo((552 - 8) / 3, 5)
  })
})

describe('shouldCompactSlotActions', () => {
  it('scale=1 的 3x3 放得下橫排按鈕，不收合', () => {
    expect(shouldCompactSlotActions('grid_3x3', 1)).toBe(false)
  })

  it('高度受限使 scale 被壓低時收合（如直向 iPad ≈0.68）', () => {
    expect(shouldCompactSlotActions('grid_3x3', 0.68)).toBe(true)
  })

  it('同一 scale 下欄數越多越容易收合', () => {
    expect(shouldCompactSlotActions('grid_1x2', 0.4)).toBe(false)
    expect(shouldCompactSlotActions('grid_4x4', 0.4)).toBe(true)
  })

  it('scale 尚未量測（<=0）時不收合，避免初始閃動', () => {
    expect(shouldCompactSlotActions('grid_3x3', 0)).toBe(false)
  })
})
