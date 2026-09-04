/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptySlotCard } from '../empty-slot-card'

describe('EmptySlotCard', () => {
  it('未傳 onRemoveSlot 時不渲染移除鈕', () => {
    render(<EmptySlotCard pageNumber={1} slotIndex={2} onAddCard={() => {}} />)
    expect(screen.queryByTestId('empty-slot-remove-1-2')).not.toBeInTheDocument()
  })

  it('點移除鈕呼叫 onRemoveSlot，且不觸發整格的 onAddCard', () => {
    const onRemoveSlot = vi.fn()
    const onAddCard = vi.fn()
    render(
      <EmptySlotCard pageNumber={1} slotIndex={2} onAddCard={onAddCard} onRemoveSlot={onRemoveSlot} />,
    )

    fireEvent.click(screen.getByTestId('empty-slot-remove-1-2'))
    expect(onRemoveSlot).toHaveBeenCalledWith(1, 2)
    // stopPropagation 沒做好的話整格點擊會連帶開啟「選擇卡片」Dialog
    expect(onAddCard).not.toHaveBeenCalled()
  })

  it('整格點擊仍是加入卡片（既有行為不變）', () => {
    const onRemoveSlot = vi.fn()
    const onAddCard = vi.fn()
    render(
      <EmptySlotCard pageNumber={2} slotIndex={0} onAddCard={onAddCard} onRemoveSlot={onRemoveSlot} />,
    )

    fireEvent.click(screen.getByTestId('empty-slot-add-2-0'))
    expect(onAddCard).toHaveBeenCalledWith(2, 0)
    expect(onRemoveSlot).not.toHaveBeenCalled()
  })

  it('拖曳中不顯示移除鈕（避免與放置目標混淆）', () => {
    render(
      <EmptySlotCard pageNumber={1} slotIndex={0} isDragging onAddCard={() => {}} onRemoveSlot={() => {}} />,
    )
    expect(screen.queryByTestId('empty-slot-remove-1-0')).not.toBeInTheDocument()
  })
})
