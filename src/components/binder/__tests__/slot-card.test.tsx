/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SlotCard } from '../slot-card'
import type { SlotWithCard } from '@/types/binder'

// Radix DropdownMenu 在 jsdom 需要這些 pointer/scroll API 存根，否則開啟選單會 throw
beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn()
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
})

function makeSlot(overrides: Partial<SlotWithCard> = {}): SlotWithCard {
  return {
    id: 'slot1',
    binderId: 'binder1',
    cardId: 'card1',
    pageNumber: 1,
    slotIndex: 0,
    status: 'owned',
    card: { id: 'card1', name: 'Pikachu', imageSmall: '', language: 'EN', cardNumber: '001', rarity: null, supertype: 'Pokémon' },
    ...overrides,
  }
}

function renderWithProviders(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>)
}

describe('SlotCard', () => {
  it('hover 顯示切換狀態/查看/刪除三顆按鈕', () => {
    renderWithProviders(
      <SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} onView={() => {}} />,
    )
    expect(screen.getByLabelText('切換為想要')).toBeInTheDocument()
    expect(screen.getByTestId('slot-view-btn-slot1')).toBeInTheDocument()
  })

  it('未傳入 onView 時不顯示查看按鈕', () => {
    renderWithProviders(<SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} />)
    expect(screen.queryByTestId('slot-view-btn-slot1')).not.toBeInTheDocument()
  })

  it('點擊查看按鈕呼叫 onView(cardId)', () => {
    const onView = vi.fn()
    renderWithProviders(
      <SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} onView={onView} />,
    )
    fireEvent.click(screen.getByTestId('slot-view-btn-slot1'))
    expect(onView).toHaveBeenCalledWith('card1')
  })

  it('isHighlighted=true 時套用 highlight 樣式', () => {
    const { getByTestId } = renderWithProviders(
      <SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} isHighlighted />,
    )
    expect(getByTestId('slot-card-slot1').className).toContain('ring-primary')
    expect(getByTestId('slot-card-slot1').className).toContain('animate-pulse')
  })

  it('isHighlighted=false 時不套用 highlight 樣式', () => {
    const { getByTestId } = renderWithProviders(
      <SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} />,
    )
    expect(getByTestId('slot-card-slot1').className).not.toContain('animate-pulse')
  })

  it('isTapped=true 時 overlay 顯示（opacity-100）', () => {
    const { container } = renderWithProviders(
      <SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} isTapped />,
    )
    const overlay = container.querySelector('.absolute.inset-0')
    expect(overlay?.className).toContain('opacity-100')
    expect(overlay?.className).not.toContain('opacity-0')
  })

  it('isTapped=false 時 overlay 預設隱藏（opacity-0 group-hover:opacity-100）', () => {
    const { container } = renderWithProviders(
      <SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} isTapped={false} />,
    )
    const overlay = container.querySelector('.absolute.inset-0')
    expect(overlay?.className).toContain('opacity-0')
    expect(overlay?.className).toContain('group-hover:opacity-100')
  })

  it('點擊卡片呼叫 onTap，且事件不向上傳播', () => {
    const onTap = vi.fn()
    const outerClick = vi.fn()
    const { getByTestId } = renderWithProviders(
      <div onClick={outerClick}>
        <SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} onTap={onTap} />
      </div>,
    )
    fireEvent.click(getByTestId('slot-card-slot1'))
    expect(onTap).toHaveBeenCalledTimes(1)
    expect(outerClick).not.toHaveBeenCalled()
  })

  it('非 compact 也有 ⋯ 選單，刪除已不再 inline', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} onView={() => {}} onCopy={() => {}} />,
    )
    expect(screen.getByTestId('slot-more-btn-slot1')).toBeInTheDocument()
    expect(screen.queryByTestId('slot-remove-btn-slot1')).not.toBeInTheDocument()
    // 複製維持 inline（非 compact 只把刪除與插入收進選單）
    expect(screen.getByTestId('slot-copy-btn-slot1')).toBeInTheDocument()
    await user.click(screen.getByTestId('slot-more-btn-slot1'))
    expect(await screen.findByTestId('slot-remove-menu-slot1')).toBeInTheDocument()
    expect(screen.queryByTestId('slot-copy-menu-slot1')).not.toBeInTheDocument()
  })

  it('⋯ 選單刪除項開啟確認框、確認後呼叫 onDelete（共用受控 AlertDialog）', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    renderWithProviders(
      <SlotCard slot={makeSlot()} onDelete={onDelete} onToggleStatus={() => {}} onView={() => {}} />,
    )
    await user.click(screen.getByTestId('slot-more-btn-slot1'))
    await user.click(await screen.findByTestId('slot-remove-menu-slot1'))
    expect(await screen.findByText('確認移除')).toBeInTheDocument()
    fireEvent.click(screen.getByText('確認移除'))
    expect(onDelete).toHaveBeenCalledWith('slot1')
  })

  it('未傳 onInsertSlot 時選單不含插入項', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} />,
    )
    await user.click(screen.getByTestId('slot-more-btn-slot1'))
    expect(await screen.findByTestId('slot-remove-menu-slot1')).toBeInTheDocument()
    expect(screen.queryByTestId('slot-insert-menu-slot1')).not.toBeInTheDocument()
  })

  it('點擊插入選單項呼叫 onInsertSlot', async () => {
    const user = userEvent.setup()
    const onInsertSlot = vi.fn()
    renderWithProviders(
      <SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} onInsertSlot={onInsertSlot} />,
    )
    await user.click(screen.getByTestId('slot-more-btn-slot1'))
    await user.click(await screen.findByTestId('slot-insert-menu-slot1'))
    expect(onInsertSlot).toHaveBeenCalledWith('slot1')
  })
})

describe('SlotCard compact（小螢幕）', () => {
  const multiSlot = () =>
    makeSlot({ card: { id: 'card1', name: 'LEGEND', imageSmall: '', language: 'EN', cardNumber: '015/100・016/100', rarity: null, supertype: 'Pokémon' } })

  it('compact 時只 inline 切換狀態＋查看＋⋯，桌面橫排按鈕（複製/跨格）不出現', () => {
    renderWithProviders(
      <SlotCard slot={multiSlot()} compact onDelete={() => {}} onToggleStatus={() => {}} onView={() => {}} onCopy={() => {}} onToggleSpan={() => {}} />,
    )
    expect(screen.getByTestId('slot-more-btn-slot1')).toBeInTheDocument()
    expect(screen.getByTestId('slot-view-btn-slot1')).toBeInTheDocument()
    expect(screen.getByLabelText('切換為想要')).toBeInTheDocument()
    // 桌面版 inline 的複製/跨格按鈕不應存在（收進選單）
    expect(screen.queryByTestId('slot-copy-btn-slot1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('slot-span-btn-slot1')).not.toBeInTheDocument()
  })

  it('compact ⋯ 選單開啟後含 跨格／複製／刪除（固定序）', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <SlotCard slot={multiSlot()} compact onDelete={() => {}} onToggleStatus={() => {}} onView={() => {}} onCopy={() => {}} onToggleSpan={() => {}} />,
    )
    await user.click(screen.getByTestId('slot-more-btn-slot1'))
    expect(await screen.findByTestId('slot-span-menu-slot1')).toBeInTheDocument()
    expect(screen.getByTestId('slot-copy-menu-slot1')).toBeInTheDocument()
    expect(screen.getByTestId('slot-remove-menu-slot1')).toBeInTheDocument()
  })

  it('compact 選單刪除項開啟確認框、確認後呼叫 onDelete', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    renderWithProviders(
      <SlotCard slot={multiSlot()} compact onDelete={onDelete} onToggleStatus={() => {}} onView={() => {}} onCopy={() => {}} onToggleSpan={() => {}} />,
    )
    await user.click(screen.getByTestId('slot-more-btn-slot1'))
    await user.click(await screen.findByTestId('slot-remove-menu-slot1'))
    expect(await screen.findByText('確認移除')).toBeInTheDocument()
    fireEvent.click(screen.getByText('確認移除'))
    expect(onDelete).toHaveBeenCalledWith('slot1')
  })

  it('有 labels 時顯示底部標籤 badge', () => {
    renderWithProviders(
      <SlotCard
        slot={makeSlot({ labels: ['No.025'] })}
        onDelete={() => {}}
        onToggleStatus={() => {}}
      />,
    )
    expect(screen.getByTestId('slot-label-slot1')).toHaveTextContent('No.025')
  })

  it('操作按鈕出現時標籤淡出讓位（兩者都在格位底部）', () => {
    const props = { onDelete: () => {}, onToggleStatus: () => {} }

    const hover = renderWithProviders(
      <SlotCard slot={makeSlot({ labels: ['No.025'] })} {...props} isTapped={false} />,
    )
    // 未 tap：桌面靠 hover 淡出
    expect(hover.getByTestId('slot-label-slot1').className).toContain('group-hover:opacity-0')

    hover.unmount()

    const tapped = renderWithProviders(
      <SlotCard slot={makeSlot({ labels: ['No.025'] })} {...props} isTapped />,
    )
    // 無 hover 裝置：tap 顯示按鈕時直接淡出
    expect(tapped.getByTestId('slot-label-slot1').className).toContain('opacity-0')
  })

  it('多個 labels 各自渲染成一顆 badge', () => {
    renderWithProviders(
      <SlotCard
        slot={makeSlot({ labels: ['No.025', 'SR', '待換'] })}
        onDelete={() => {}}
        onToggleStatus={() => {}}
      />,
    )
    expect(screen.getByTestId('slot-label-item-slot1-0')).toHaveTextContent('No.025')
    expect(screen.getByTestId('slot-label-item-slot1-1')).toHaveTextContent('SR')
    expect(screen.getByTestId('slot-label-item-slot1-2')).toHaveTextContent('待換')
  })

  it('labels 為空時不渲染標籤區塊', () => {
    renderWithProviders(<SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} />)
    expect(screen.queryByTestId('slot-label-slot1')).not.toBeInTheDocument()
  })

  it('跨格群組成員（groupIndex > 0）不顯示標籤、也沒有編輯入口', async () => {
    const user = userEvent.setup()
    const member = makeSlot({
      labels: ['No.025'],
      span: { groupId: 'g1', groupIndex: 1, cols: 2, rows: 1, rotation: 0, imageUrl: null },
    })
    renderWithProviders(
      <SlotCard slot={member} onDelete={() => {}} onToggleStatus={() => {}} onEditLabel={() => {}} />,
    )
    expect(screen.queryByTestId('slot-label-slot1')).not.toBeInTheDocument()
    await user.click(screen.getByTestId('slot-more-btn-slot1'))
    expect(screen.queryByTestId('slot-label-menu-slot1')).not.toBeInTheDocument()
  })

  it('⋯ 選單的編輯標籤項呼叫 onEditLabel(slotId)', async () => {
    const user = userEvent.setup()
    const onEditLabel = vi.fn()
    renderWithProviders(
      <SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} onEditLabel={onEditLabel} />,
    )
    await user.click(screen.getByTestId('slot-more-btn-slot1'))
    await user.click(await screen.findByTestId('slot-label-menu-slot1'))
    expect(onEditLabel).toHaveBeenCalledWith('slot1')
  })

  it('未傳 onEditLabel 時選單不含編輯標籤項', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SlotCard slot={makeSlot()} onDelete={() => {}} onToggleStatus={() => {}} />)
    await user.click(screen.getByTestId('slot-more-btn-slot1'))
    expect(await screen.findByTestId('slot-remove-menu-slot1')).toBeInTheDocument()
    expect(screen.queryByTestId('slot-label-menu-slot1')).not.toBeInTheDocument()
  })

  it('非複數卡的 compact 選單不含跨格項', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <SlotCard slot={makeSlot()} compact onDelete={() => {}} onToggleStatus={() => {}} onView={() => {}} onCopy={() => {}} onToggleSpan={() => {}} />,
    )
    await user.click(screen.getByTestId('slot-more-btn-slot1'))
    expect(await screen.findByTestId('slot-copy-menu-slot1')).toBeInTheDocument()
    expect(screen.queryByTestId('slot-span-menu-slot1')).not.toBeInTheDocument()
  })
})
