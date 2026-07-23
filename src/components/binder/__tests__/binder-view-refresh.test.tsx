/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BinderView } from '../binder-view'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { BinderDetailResponse, SlotWithCard } from '@/types/binder'

vi.mock('@/hooks/use-is-mobile', () => ({
  useIsMobile: () => false,
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
  CardDetailDrawer: () => null,
}))

vi.mock('../slot-card-picker-dialog', () => ({
  SlotCardPickerDialog: () => null,
}))

vi.mock('../binder-settings-drawer', () => ({
  BinderSettingsDrawer: () => null,
}))

vi.mock('../binder-spread-view', () => ({
  BinderSpreadView: ({
    spreadIndex,
    slots,
    refreshSlot,
  }: {
    spreadIndex: number
    slots: SlotWithCard[]
    refreshSlot?: React.ReactNode
  }) => (
    <div>
      <div data-testid="spread-index">{spreadIndex}</div>
      <div data-testid="slots-count">{slots.length}</div>
      {refreshSlot}
    </div>
  ),
}))

vi.mock('../binder-mobile-view', () => ({
  BinderMobileView: () => null,
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

describe('BinderView 重整鍵', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('點擊重整鍵後以新資料更新 slots，且翻頁位置維持不變', async () => {
    render(<TooltipProvider><BinderView binder={makeBinder()} /></TooltipProvider>)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('spread-index')).toHaveTextContent('2')
    expect(screen.getByTestId('slots-count')).toHaveTextContent('0')

    const newSlot: SlotWithCard = {
      id: 'slot-new',
      binderId: 'binder-1',
      cardId: 'card-1',
      pageNumber: 1,
      slotIndex: 0,
      status: 'owned',
      card: { id: 'card-1', name: 'Pikachu', imageSmall: '', language: 'EN', cardNumber: '58', rarity: null },
    }
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'binder-1', totalPages: 4, slots: [newSlot] }),
    } as Response)

    fireEvent.click(screen.getByTestId('binder-refresh-btn'))

    await waitFor(() => expect(screen.getByTestId('slots-count')).toHaveTextContent('1'))
    // 翻頁位置保留在第 2 個 spread（頁數不變），未被重設回 0
    expect(screen.getByTestId('spread-index')).toHaveTextContent('2')
    expect(fetch).toHaveBeenCalledWith('/api/binders/binder-1')
  })

  it('重整後頁數縮減時，翻頁 index clamp 到新上限', async () => {
    render(<TooltipProvider><BinderView binder={makeBinder()} /></TooltipProvider>)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('spread-index')).toHaveTextContent('2')

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'binder-1', totalPages: 1, slots: [] }),
    } as Response)

    fireEvent.click(screen.getByTestId('binder-refresh-btn'))

    // totalPages=1 → spreads.length=1（僅 spread 0：封面 + page1），index clamp 到 0
    await waitFor(() => expect(screen.getByTestId('spread-index')).toHaveTextContent('0'))
  })

  it('重整失敗（API 錯誤）不清空既有 slots', async () => {
    const { toast } = await import('sonner')
    render(<TooltipProvider><BinderView binder={makeBinder()} /></TooltipProvider>)

    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response)
    fireEvent.click(screen.getByTestId('binder-refresh-btn'))

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(screen.getByTestId('slots-count')).toHaveTextContent('0')
  })
})
