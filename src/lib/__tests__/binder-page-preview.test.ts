import { describe, it, expect } from 'vitest'
import type { GridType } from '@prisma/client'
import {
  getPagePreviewSize,
  PAGE_PREVIEW_HEIGHT,
  PAGE_PREVIEW_GAP,
} from '@/lib/binder-page-preview'
import { GRID_TYPE_COLS, GRID_TYPE_SLOTS } from '@/types/binder'

const ALL_GRID_TYPES = Object.keys(GRID_TYPE_SLOTS) as GridType[]

describe('getPagePreviewSize', () => {
  it('cols/rows 與 GRID_TYPE_COLS / GRID_TYPE_SLOTS 一致', () => {
    for (const gt of ALL_GRID_TYPES) {
      const { cols, rows } = getPagePreviewSize(gt)
      expect(cols).toBe(GRID_TYPE_COLS[gt])
      expect(cols * rows).toBe(GRID_TYPE_SLOTS[gt])
    }
  })

  it('五種格式的寬度皆 <= 140px（Dialog grid 每欄放得下）', () => {
    for (const gt of ALL_GRID_TYPES) {
      expect(getPagePreviewSize(gt).width).toBeLessThanOrEqual(140)
    }
  })

  it('每格維持 5:7 卡片比例', () => {
    for (const gt of ALL_GRID_TYPES) {
      const { cellWidth, cellHeight } = getPagePreviewSize(gt)
      expect(cellWidth / cellHeight).toBeCloseTo(5 / 7, 5)
    }
  })

  it('固定高度：各格式的總高度皆等於 PAGE_PREVIEW_HEIGHT（列高一致）', () => {
    for (const gt of ALL_GRID_TYPES) {
      const { rows, cellHeight } = getPagePreviewSize(gt)
      expect(rows * cellHeight + PAGE_PREVIEW_GAP * (rows - 1)).toBeCloseTo(PAGE_PREVIEW_HEIGHT, 5)
    }
  })

  it('grid_1x2 與 grid_4x4 高度相同、寬度不同（固定高度反推寬度的核心行為）', () => {
    const a = getPagePreviewSize('grid_1x2')
    const b = getPagePreviewSize('grid_4x4')
    expect(a.rows * a.cellHeight + PAGE_PREVIEW_GAP * (a.rows - 1)).toBeCloseTo(
      b.rows * b.cellHeight + PAGE_PREVIEW_GAP * (b.rows - 1),
      5,
    )
    expect(a.width).not.toBeCloseTo(b.width, 1)
  })

  it('width 計入欄間 gap', () => {
    const { cols, cellWidth, width } = getPagePreviewSize('grid_3x3')
    expect(width).toBeCloseTo(cols * cellWidth + PAGE_PREVIEW_GAP * (cols - 1), 5)
  })

  it('可覆寫 height / gap', () => {
    const { rows, cellHeight, cellWidth } = getPagePreviewSize('grid_3x3', 90, 0)
    expect(rows * cellHeight).toBeCloseTo(90, 5)
    expect(cellWidth / cellHeight).toBeCloseTo(5 / 7, 5)
  })
})
