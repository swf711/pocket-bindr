/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BinderGrid } from '../binder-grid'
import type { BinderSlotItem, EmptySlot } from '@/types/binder'

function makeEmptySlots(count: number): BinderSlotItem[] {
  return Array.from(
    { length: count },
    (_, i) => ({ id: null, pageNumber: 1, slotIndex: i }) satisfies EmptySlot,
  )
}

function renderGrid(gridType: Parameters<typeof BinderGrid>[0]['gridType'], slotCount: number) {
  return render(
    <BinderGrid
      slots={makeEmptySlots(slotCount)}
      gridType={gridType}
      onDelete={() => {}}
      onToggleStatus={() => {}}
      onSwap={() => {}}
      onMove={() => {}}
    />,
  )
}

describe('BinderGrid grid_4x3', () => {
  it('渲染 4 欄（gridTemplateColumns repeat(4, ...)）', () => {
    const { container } = renderGrid('grid_4x3', 12)
    const grid = container.querySelector('.grid') as HTMLElement
    expect(grid.style.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))')
  })

  it('每頁渲染 12 個格位', () => {
    const { container } = renderGrid('grid_4x3', 12)
    expect(container.querySelectorAll('[data-index]')).toHaveLength(12)
  })
})
