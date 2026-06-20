/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SlotCard } from '../slot-card'
import type { SlotWithCard } from '@/types/binder'

function makeSlot(overrides: Partial<SlotWithCard> = {}): SlotWithCard {
  return {
    id: 'slot1',
    binderId: 'binder1',
    cardId: 'card1',
    pageNumber: 1,
    slotIndex: 0,
    status: 'owned',
    card: { id: 'card1', name: 'Pikachu', imageSmall: '', language: 'EN', cardNumber: '001', rarity: null },
    ...overrides,
  }
}

describe('SlotCard', () => {
  it('hover 顯示切換狀態/查看/刪除三顆按鈕', () => {
    render(
      <SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} onView={() => {}} />,
    )
    expect(screen.getByTitle('切換為想要')).toBeInTheDocument()
    expect(screen.getByTitle('查看卡牌詳情')).toBeInTheDocument()
  })

  it('未傳入 onView 時不顯示查看按鈕', () => {
    render(<SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} />)
    expect(screen.queryByTitle('查看卡牌詳情')).not.toBeInTheDocument()
  })

  it('點擊查看按鈕呼叫 onView(cardId)', () => {
    const onView = vi.fn()
    render(
      <SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} onView={onView} />,
    )
    fireEvent.click(screen.getByTitle('查看卡牌詳情'))
    expect(onView).toHaveBeenCalledWith('card1')
  })

  it('isHighlighted=true 時套用 highlight 樣式', () => {
    const { getByTestId } = render(
      <SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} isHighlighted />,
    )
    expect(getByTestId('slot-card-slot1').className).toContain('ring-primary')
    expect(getByTestId('slot-card-slot1').className).toContain('animate-pulse')
  })

  it('isHighlighted=false 時不套用 highlight 樣式', () => {
    const { getByTestId } = render(
      <SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} />,
    )
    expect(getByTestId('slot-card-slot1').className).not.toContain('animate-pulse')
  })

  it('isTapped=true 時 overlay 顯示（opacity-100）', () => {
    const { container } = render(
      <SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} isTapped />,
    )
    const overlay = container.querySelector('.absolute.inset-0')
    expect(overlay?.className).toContain('opacity-100')
    expect(overlay?.className).not.toContain('opacity-0')
  })

  it('isTapped=false 時 overlay 預設隱藏（opacity-0 group-hover:opacity-100）', () => {
    const { container } = render(
      <SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} isTapped={false} />,
    )
    const overlay = container.querySelector('.absolute.inset-0')
    expect(overlay?.className).toContain('opacity-0')
    expect(overlay?.className).toContain('group-hover:opacity-100')
  })

  it('點擊卡片呼叫 onTap，且事件不向上傳播', () => {
    const onTap = vi.fn()
    const outerClick = vi.fn()
    const { getByTestId } = render(
      <div onClick={outerClick}>
        <SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} onTap={onTap} />
      </div>,
    )
    fireEvent.click(getByTestId('slot-card-slot1'))
    expect(onTap).toHaveBeenCalledTimes(1)
    expect(outerClick).not.toHaveBeenCalled()
  })
})
