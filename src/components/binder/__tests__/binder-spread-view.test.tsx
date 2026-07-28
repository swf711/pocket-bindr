/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { createElement } from 'react'
import { beforeEach, describe, it, expect, vi } from 'vitest'

// 包裝（非取代）DndContext 以攔截 handler props；DragOverlay 改為直接渲染 children，
// 讓 activeSlot 的清除與否可在 jsdom 下被觀察（真 DragOverlay 依賴 dnd-kit 內部 active state）。
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>()
  const { captureDndHandlers } = await import('../../__tests__/helpers/dnd-capture')
  return {
    ...actual,
    DndContext: (props: React.ComponentProps<typeof actual.DndContext>) => {
      captureDndHandlers(props)
      return createElement(actual.DndContext, props)
    },
    DragOverlay: (props: { children?: React.ReactNode }) =>
      createElement('div', { 'data-testid': 'drag-overlay' }, props.children),
  }
})

// 可控制 useHasNoHover 回傳值以模擬 iPad（無 hover）／桌面（有 hover）
const mockNoHover = vi.fn(() => false)
vi.mock('@/hooks/use-has-hover', () => ({
  useHasNoHover: () => mockNoHover(),
}))

import { render, screen, act, fireEvent } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { BinderSpreadView } from '../binder-spread-view'
import {
  fireDragCancel,
  fireDragStart,
  resetCapturedDndHandlers,
} from '../../__tests__/helpers/dnd-capture'
import { buildGridPages, buildSpreads } from '@/lib/binder-utils'
import type { SlotWithCard } from '@/types/binder'

const SLOT: SlotWithCard = {
  id: 'slot-1',
  binderId: 'binder-1',
  cardId: 'card-1',
  pageNumber: 1,
  slotIndex: 0,
  status: 'owned',
  card: {
    id: 'card-1',
    name: '皮卡丘',
    imageSmall: 'https://example.com/card-1.png',
    language: 'ZH_TW',
    cardNumber: '001',
    rarity: 'RR',
    supertype: 'Pokémon',
  },
}

function renderSpreadView(onDraggingChange: (dragging: boolean) => void) {
  const pages = [...buildGridPages([SLOT], 'grid_3x3', 1).values()]
  const spreads = buildSpreads(pages)
  return render(
    <TooltipProvider>
      <BinderSpreadView
        spreads={spreads}
        spreadIndex={0}
        onSpreadChange={() => {}}
        coverColor="#045387"
        binderName="測試卡冊"
        slots={[SLOT]}
        totalPages={1}
        gridType="grid_3x3"
        onDraggingChange={onDraggingChange}
        onDelete={() => {}}
        onToggleStatus={() => {}}
        onSwap={() => {}}
        onMove={() => {}}
        onJumpToSlot={() => {}}
        onAddPage={() => {}}
        settingsSlot={null}
      />
    </TooltipProvider>,
  )
}

beforeEach(() => {
  resetCapturedDndHandlers()
  mockNoHover.mockReturnValue(false)
})

/** 取操作按鈕 overlay 外層容器（slot-card 內含 `inset-0` 的浮層），用 class 判斷是否顯示 */
function getOverlay(): HTMLElement {
  const card = screen.getByTestId('slot-card-slot-1')
  const overlay = card.querySelector('.inset-0') as HTMLElement
  expect(overlay).toBeTruthy()
  return overlay
}

describe('BinderSpreadView tap-to-reveal（無 hover 裝置，如 iPad）', () => {
  it('無 hover 時點擊格位顯示操作按鈕、再點收起', () => {
    mockNoHover.mockReturnValue(true)
    renderSpreadView(() => {})

    // 初始隱藏（僅 hover 才顯示）
    expect(getOverlay().className).toContain('opacity-0')

    // 點擊格位 → 顯示
    fireEvent.click(screen.getByTestId('slot-card-slot-1'))
    expect(getOverlay().className).toContain('opacity-100')
    expect(getOverlay().className).not.toContain('opacity-0')

    // 再點擊同格 → 收起
    fireEvent.click(screen.getByTestId('slot-card-slot-1'))
    expect(getOverlay().className).toContain('opacity-0')
  })

  it('有 hover（桌面）時點擊格位不觸發 tap 顯示，維持純 hover', () => {
    mockNoHover.mockReturnValue(false)
    renderSpreadView(() => {})

    fireEvent.click(screen.getByTestId('slot-card-slot-1'))
    // 桌面未接線 onTap，overlay 仍靠 group-hover，維持 opacity-0
    expect(getOverlay().className).toContain('opacity-0')
  })
})

describe('BinderSpreadView 取消拖曳（onDragCancel）', () => {
  it('拖曳開始時進入拖曳狀態並顯示拖曳中的卡牌', async () => {
    const onDraggingChange = vi.fn()
    renderSpreadView(onDraggingChange)

    await act(async () => { fireDragStart('binder-spread-dnd', 'slot-slot-1') })

    expect(onDraggingChange).toHaveBeenLastCalledWith(true)
    expect(screen.getByTestId('drag-overlay-card')).toBeInTheDocument()
  })

  it('拖曳被取消（Esc）後重置狀態，不殘留拖曳中的卡牌', async () => {
    const onDraggingChange = vi.fn()
    renderSpreadView(onDraggingChange)

    await act(async () => { fireDragStart('binder-spread-dnd', 'slot-slot-1') })
    await act(async () => { fireDragCancel('binder-spread-dnd', 'slot-slot-1') })

    expect(onDraggingChange).toHaveBeenLastCalledWith(false)
    expect(screen.queryByTestId('drag-overlay-card')).not.toBeInTheDocument()
  })
})
