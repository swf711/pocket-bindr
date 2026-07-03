/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render as baseRender, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/components/ui/tooltip'

// CardDetailDrawer 內部無條件呼叫 new ResizeObserver()（量測 overlay 高度），
// 現在 ScrollArea（Radix useSize）也會在同一次 render 呼叫 new ResizeObserver()。
// jsdom 本身不提供此 API，需手動 stub；用真的 class 而非 vi.fn().mockImplementation(箭頭函式)——
// 箭頭函式沒有 [[Construct]]，vitest 內部以 Reflect.construct 呼叫 new 時會丟出
// 「is not a constructor」。
beforeEach(() => {
  class MockResizeObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  }
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// icon-only 導航按鈕已改用 Tooltip，需 TooltipProvider context（正式環境由 root layout 提供）
const render = ((ui: Parameters<typeof baseRender>[0]) =>
  baseRender(ui, { wrapper: TooltipProvider })) as typeof baseRender

// Mock modules that have side effects or are not needed for navigation tests
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/components/auth/login-modal', () => ({
  LoginModal: () => null,
}))

// Mock fetch used inside AddToBinderSection (returns 401 = guest, so that section
// renders a simple "login" button — navigation buttons are outside that section).
global.fetch = vi.fn().mockResolvedValue({ status: 401, ok: false })

import { CardDetailDrawer } from '../card-detail-drawer'
import { CardWithCollectionStatus } from '@/types/card'

function makeCard(id: string, name: string, overrides: Partial<CardWithCollectionStatus> = {}): CardWithCollectionStatus {
  return {
    id,
    name,
    imageSmall: '',
    imageLarge: '',
    supertype: 'Pokémon',
    rarity: null,
    hp: null,
    types: [],
    cardNumber: `00${id}`,
    isCollectible: true,
    canonicalCardId: null,
    attributes: null,
    collectionStatus: { owned: null, wanted: null },
    set: { id: 'set1', name: 'Test Set', series: 'Scarlet & Violet', externalId: 'SV1', releaseDate: '2024-01-26T00:00:00.000Z' },
    ...overrides,
  }
}

const cardA = makeCard('1', 'Card A')
const cardB = makeCard('2', 'Card B')
const cardC = makeCard('3', 'Card C')
const cards = [cardA, cardB, cardC]

describe('CardDetailDrawer — 資訊欄位', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 401, ok: false })
  })

  function renderSingle(overrides: Partial<CardWithCollectionStatus> = {}) {
    const card = makeCard('x', 'Test Card', overrides)
    render(<CardDetailDrawer card={card} open={true} onClose={vi.fn()} />)
    return card
  }

  it('系列顯示 set.name 與 set.externalId', () => {
    renderSingle()
    expect(screen.getByText('Test Set')).toBeInTheDocument()
    expect(screen.getByText('SV1')).toBeInTheDocument()
  })

  it('不顯示類型 / 世代列（已移除）', () => {
    renderSingle({ supertype: 'Trainer' })
    expect(screen.queryByText('類型')).not.toBeInTheDocument()
    expect(screen.queryByText('世代')).not.toBeInTheDocument()
  })

  it('顯示 set.releaseDate 格式化為 YYYY-MM-DD', () => {
    renderSingle()
    expect(screen.getByText('2024-01-26')).toBeInTheDocument()
  })

  it('set.releaseDate 為 null 時不顯示發售日列', () => {
    renderSingle({ set: { id: 'set1', name: 'Test Set', series: 'S&V', externalId: 'SV1', releaseDate: null } })
    expect(screen.queryByText('發售日')).not.toBeInTheDocument()
  })
})

describe('CardDetailDrawer navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 401, ok: false })
  })

  function renderModal(currentIndex: number, onNavigate = vi.fn()) {
    return {
      onNavigate,
      ...render(
        <CardDetailDrawer
          card={cards[currentIndex]}
          open={true}
          onClose={vi.fn()}
          cards={cards}
          currentIndex={currentIndex}
          onNavigate={onNavigate}
        />
      ),
    }
  }

  it('disables prev button when currentIndex === 0', () => {
    renderModal(0)
    const prevBtn = screen.getByTestId('modal-nav-prev')
    expect(prevBtn).toBeDisabled()
  })

  it('disables next button when currentIndex === cards.length - 1', () => {
    renderModal(2)
    const nextBtn = screen.getByTestId('modal-nav-next')
    expect(nextBtn).toBeDisabled()
  })

  it('calls onNavigate(currentIndex - 1) when prev clicked', async () => {
    const user = userEvent.setup()
    const { onNavigate } = renderModal(1)
    await user.click(screen.getByTestId('modal-nav-prev'))
    expect(onNavigate).toHaveBeenCalledWith(0)
  })

  it('calls onNavigate(currentIndex + 1) when next clicked', async () => {
    const user = userEvent.setup()
    const { onNavigate } = renderModal(1)
    await user.click(screen.getByTestId('modal-nav-next'))
    expect(onNavigate).toHaveBeenCalledWith(2)
  })

  it('calls onNavigate on ArrowLeft keydown', () => {
    const onNavigate = vi.fn()
    renderModal(1, onNavigate)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(onNavigate).toHaveBeenCalledWith(0)
  })

  it('calls onNavigate on ArrowRight keydown', () => {
    const onNavigate = vi.fn()
    renderModal(1, onNavigate)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(onNavigate).toHaveBeenCalledWith(2)
  })

  it('does not call onNavigate on ArrowLeft when at index 0', () => {
    const onNavigate = vi.fn()
    renderModal(0, onNavigate)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('does not call onNavigate on ArrowRight when at last index', () => {
    const onNavigate = vi.fn()
    renderModal(2, onNavigate)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(onNavigate).not.toHaveBeenCalled()
  })
})

describe('CardDetailDrawer hideAddToBinder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 401, ok: false })
  })

  it('預設顯示加入卡冊區塊', async () => {
    render(<CardDetailDrawer card={cardA} open={true} onClose={vi.fn()} />)
    expect(await screen.findByText('請先登入以加入卡冊')).toBeInTheDocument()
  })

  it('hideAddToBinder=true 時不顯示加入卡冊區塊', async () => {
    render(<CardDetailDrawer card={cardA} open={true} onClose={vi.fn()} hideAddToBinder />)
    await new Promise((r) => setTimeout(r, 0))
    expect(screen.queryByText('請先登入以加入卡冊')).not.toBeInTheDocument()
  })
})

describe('CardDetailDrawer currentBinderId 預選', () => {
  const binders = [
    { id: 'b1', name: 'Binder One' },
    { id: 'b2', name: 'Binder Two' },
    { id: 'b3', name: 'Binder Three' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => binders,
    })
  })

  // 卡冊以 shadcn Select 呈現，trigger 內顯示當前選中卡冊名稱（SelectValue）
  it('currentBinderId 命中清單時預選該卡冊', async () => {
    render(
      <CardDetailDrawer card={cardA} open={true} onClose={vi.fn()} onAddToBinder={vi.fn()} currentBinderId="b2" />,
    )
    const trigger = await screen.findByTestId('modal-binder-select')
    expect(trigger).toHaveTextContent('Binder Two')
  })

  it('currentBinderId 不在清單時 fallback 預設第一本', async () => {
    render(
      <CardDetailDrawer card={cardA} open={true} onClose={vi.fn()} onAddToBinder={vi.fn()} currentBinderId="nope" />,
    )
    const trigger = await screen.findByTestId('modal-binder-select')
    expect(trigger).toHaveTextContent('Binder One')
  })

  it('未提供 currentBinderId 時維持預設第一本', async () => {
    render(<CardDetailDrawer card={cardA} open={true} onClose={vi.fn()} onAddToBinder={vi.fn()} />)
    const trigger = await screen.findByTestId('modal-binder-select')
    expect(trigger).toHaveTextContent('Binder One')
  })
})
