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
})
