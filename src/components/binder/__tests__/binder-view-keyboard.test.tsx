/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BinderView } from '../binder-view'
import type { BinderDetailResponse } from '@/types/binder'

let mockIsMobile = false

vi.mock('@/hooks/use-is-mobile', () => ({
  useIsMobile: () => mockIsMobile,
}))

vi.mock('@/hooks/use-swap-slots', () => ({
  useSwapSlots: () => ({ mutate: vi.fn() }),
}))

vi.mock('@/hooks/use-add-to-binder', () => ({
  useAddToBinder: () => ({ mutateAsync: vi.fn().mockResolvedValue({}) }),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

vi.mock('@/components/cards/card-detail-drawer', () => ({
  CardDetailDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="view-open" /> : null,
}))

vi.mock('../slot-card-picker-dialog', () => ({
  SlotCardPickerDialog: () => null,
}))

vi.mock('../binder-spread-view', () => ({
  BinderSpreadView: ({
    spreadIndex,
    onView,
    onAddCard,
  }: {
    spreadIndex: number
    onView: (cardId: string) => void
    onAddCard: (pageNumber: number, slotIndex: number) => void
  }) => (
    <div>
      <div data-testid="spread-index">{spreadIndex}</div>
      <button data-testid="trigger-view" onClick={() => onView('card-1')}>view</button>
      <button data-testid="trigger-add-card" onClick={() => onAddCard(1, 0)}>add</button>
    </div>
  ),
}))

vi.mock('../binder-mobile-view', () => ({
  BinderMobileView: ({ pageIndex }: { pageIndex: number }) => (
    <div data-testid="mobile-page-index">{pageIndex}</div>
  ),
}))

function makeBinder(overrides: Partial<BinderDetailResponse> = {}): BinderDetailResponse {
  return {
    id: 'binder-1',
    name: 'Test Binder',
    gridType: 'grid_2x2',
    coverColor: '#4A5568',
    description: null,
    settings: { totalPages: 4 },
    slots: [],
    shareToken: null,
    ...overrides,
  }
}

describe('BinderView 方向鍵翻頁', () => {
  beforeEach(() => {
    mockIsMobile = false
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'card-1' }),
    }))
  })

  it('ArrowRight 遞增 spreadIndex，ArrowLeft 遞減，並各自 clamp 邊界', () => {
    render(<BinderView binder={makeBinder()} />)
    expect(screen.getByTestId('spread-index')).toHaveTextContent('0')

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByTestId('spread-index')).toHaveTextContent('0') // clamp 下界

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('spread-index')).toHaveTextContent('1')

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('spread-index')).toHaveTextContent('2')

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('spread-index')).toHaveTextContent('2') // clamp 上界（spreads.length=3）

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByTestId('spread-index')).toHaveTextContent('1')
  })

  it('mobile 模式下方向鍵操作 mobilePageIndex', () => {
    mockIsMobile = true
    render(<BinderView binder={makeBinder()} />)
    expect(screen.getByTestId('mobile-page-index')).toHaveTextContent('0')

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('mobile-page-index')).toHaveTextContent('1')
  })

  it('viewCard 開啟時方向鍵不翻頁', async () => {
    render(<BinderView binder={makeBinder()} />)
    fireEvent.click(screen.getByTestId('trigger-view'))
    await waitFor(() => expect(screen.getByTestId('view-open')).toBeInTheDocument())
    // waitFor 只保證 render 已 commit；keydown guard 的 useEffect（deps 含 viewCard）
    // 重新註冊 listener 是另一個 passive effect，可能尚未 flush。強制 drain 一次，
    // 確保接下來的 keyDown 打中已更新的 guard closure，而非仍捕捉 viewCard===null 的舊 closure。
    await act(async () => {})

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('spread-index')).toHaveTextContent('0')
  })

  it('pickerTarget 開啟時方向鍵不翻頁', () => {
    render(<BinderView binder={makeBinder()} />)
    fireEvent.click(screen.getByTestId('trigger-add-card'))

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('spread-index')).toHaveTextContent('0')
  })

  it('focus 在 [role=dialog] 內時方向鍵不翻頁', () => {
    render(
      <>
        <BinderView binder={makeBinder()} />
        <div role="dialog">
          <input data-testid="dialog-input" />
        </div>
      </>,
    )
    screen.getByTestId('dialog-input').focus()

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('spread-index')).toHaveTextContent('0')
  })

  it('focus 在 INPUT 時方向鍵不翻頁', () => {
    render(
      <>
        <BinderView binder={makeBinder()} />
        <input data-testid="plain-input" />
      </>,
    )
    screen.getByTestId('plain-input').focus()

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('spread-index')).toHaveTextContent('0')
  })
})
