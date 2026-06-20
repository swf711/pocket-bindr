/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BinderCoverPanel } from '../binder-cover-panel'
import type { SlotWithCard } from '@/types/binder'

vi.mock('@/lib/get-card-image-url', () => ({
  getCardImageUrl: (url: string) => url,
}))

function makeSlot(overrides: Partial<SlotWithCard> = {}): SlotWithCard {
  return {
    id: 'slot-1',
    binderId: 'binder-1',
    cardId: 'card-1',
    pageNumber: 1,
    slotIndex: 0,
    status: 'owned',
    card: {
      id: 'card-1',
      name: 'Pikachu',
      imageSmall: '/pikachu.jpg',
      language: 'EN',
      cardNumber: '025',
      rarity: 'Common',
    },
    ...overrides,
  }
}

function renderPanel(
  overrides: Partial<Parameters<typeof BinderCoverPanel>[0]> = {},
) {
  const defaultProps = {
    binderName: 'My Binder',
    slots: [],
    gridType: 'grid_3x3' as const,
    totalPages: 5,
    onJumpToSlot: vi.fn(),
    counterScale: 1,
  }
  return render(<BinderCoverPanel {...defaultProps} {...overrides} />)
}

describe('BinderCoverPanel', () => {
  it('data-testid="binder-cover-panel" 存在', () => {
    renderPanel()
    expect(screen.getByTestId('binder-cover-panel')).toBeInTheDocument()
  })

  it('顯示卡冊標題', () => {
    renderPanel({ binderName: 'Test Binder' })
    expect(screen.getByText('Test Binder')).toBeInTheDocument()
  })

  it('有 description 時顯示描述文字', () => {
    renderPanel({ description: '這是我的卡冊描述' })
    expect(screen.getByText('這是我的卡冊描述')).toBeInTheDocument()
  })

  it('description 為 null 時不顯示描述區塊', () => {
    renderPanel({ description: null })
    expect(screen.queryByText('這是我的卡冊描述')).not.toBeInTheDocument()
  })

  it('description 未傳時不顯示描述區塊', () => {
    renderPanel()
    expect(screen.getByText('My Binder')).toBeInTheDocument()
    expect(screen.queryByText('描述')).not.toBeInTheDocument()
  })

  it('頁數區塊顯示 totalPages / 100 頁', () => {
    renderPanel({ totalPages: 10 })
    // 頁數跨兩個 span，以 container textContent 比對
    expect(screen.getByText((_, el) =>
      el?.textContent?.replace(/\s+/g, ' ').trim() === '10 / 100 頁'
    )).toBeInTheDocument()
  })

  it('卡片統計：顯示 slots.length 張', () => {
    const slots = [makeSlot(), makeSlot({ id: 'slot-2', cardId: 'card-2' })]
    renderPanel({ slots })
    // 新格式：顯示「X / Y 格卡槽」，X = slots.length
    expect(screen.getByText((_, el) =>
      !!(el?.textContent?.replace(/\s+/g, ' ').trim().match(/^2 \/ \d+ 格卡槽$/))
    )).toBeInTheDocument()
  })

  it('卡片統計：顯示擁有數與想要數', () => {
    const slots = [
      makeSlot({ id: 'slot-1', status: 'owned' }),
      makeSlot({ id: 'slot-2', status: 'wanted' }),
    ]
    renderPanel({ slots })
    expect(screen.getByText('擁有 1 / 想要 1')).toBeInTheDocument()
  })

  it('data-testid="binder-cover-progress" 存在（收集進度條）', () => {
    renderPanel()
    // 卡片進度條與收藏進度條均使用此 testid
    const progressBars = screen.getAllByTestId('binder-cover-progress')
    expect(progressBars.length).toBeGreaterThanOrEqual(1)
  })

  it('totalSlots = 0 時 collectionProgress 為 0（不除以零）', () => {
    renderPanel({ slots: [], totalPages: 1 })
    const progressBars = screen.getAllByTestId('binder-cover-progress')
    expect(progressBars[0]).toBeInTheDocument()
  })

  it('data-testid="cover-slot-search" 存在', () => {
    renderPanel()
    expect(screen.getByTestId('cover-slot-search')).toBeInTheDocument()
  })

  it('搜尋框輸入後顯示過濾結果', () => {
    const slots = [makeSlot({ card: { id: 'c1', name: 'Pikachu', imageSmall: '', language: 'EN', cardNumber: '025', rarity: null } })]
    renderPanel({ slots })
    const input = screen.getByTestId('cover-slot-search')
    fireEvent.change(input, { target: { value: 'Pika' } })
    expect(screen.getByTestId('cover-slot-search-results')).toBeInTheDocument()
    expect(screen.getByText('Pikachu')).toBeInTheDocument()
  })

  it('搜尋無結果顯示「查無符合的卡牌」', () => {
    const slots = [makeSlot()]
    renderPanel({ slots })
    const input = screen.getByTestId('cover-slot-search')
    fireEvent.change(input, { target: { value: 'Charizard' } })
    expect(screen.getByText('查無符合的卡牌')).toBeInTheDocument()
  })

  it('點擊搜尋結果呼叫 onJumpToSlot 並清空搜尋框', () => {
    const onJumpToSlot = vi.fn()
    const slot = makeSlot()
    renderPanel({ slots: [slot], onJumpToSlot })
    const input = screen.getByTestId('cover-slot-search')
    fireEvent.change(input, { target: { value: 'Pika' } })
    const result = screen.getByTestId(`cover-search-result-${slot.id}`)
    fireEvent.click(result)
    expect(onJumpToSlot).toHaveBeenCalledWith(slot)
    expect(screen.queryByTestId('cover-slot-search-results')).not.toBeInTheDocument()
  })
})
