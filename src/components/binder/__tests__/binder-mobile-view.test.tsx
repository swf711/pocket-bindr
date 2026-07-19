/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { createElement } from 'react'
import { beforeEach, describe, it, expect, vi } from 'vitest'

// 同 binder-spread-view.test.tsx：攔截 DndContext handler props，DragOverlay 改為直接渲染 children。
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

import { render, screen, act } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { BinderMobileView } from '../binder-mobile-view'
import {
  fireDragCancel,
  fireDragStart,
  resetCapturedDndHandlers,
} from '../../__tests__/helpers/dnd-capture'
import { buildGridPages, buildMobilePages } from '@/lib/binder-utils'
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
  },
}

function renderMobileView() {
  const pages = [...buildGridPages([SLOT], 'grid_3x3', 1).values()]
  const mobilePages = buildMobilePages(pages)
  return render(
    <TooltipProvider>
      <BinderMobileView
        mobilePages={mobilePages}
        pageIndex={1} // 0 = 封面，1 = 第 1 頁（有格位可拖）
        onPageChange={() => {}}
        coverColor="#045387"
        binderName="測試卡冊"
        slots={[SLOT]}
        totalPages={1}
        gridType="grid_3x3"
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
})

describe('BinderMobileView 取消拖曳（onDragCancel）', () => {
  it('拖曳開始時顯示拖曳中的卡牌', async () => {
    renderMobileView()

    await act(async () => { fireDragStart('binder-mobile-dnd', 'slot-slot-1') })

    expect(screen.getByTestId('drag-overlay-card')).toBeInTheDocument()
  })

  it('拖曳被取消後重置狀態，不殘留拖曳中的卡牌', async () => {
    renderMobileView()

    await act(async () => { fireDragStart('binder-mobile-dnd', 'slot-slot-1') })
    await act(async () => { fireDragCancel('binder-mobile-dnd', 'slot-slot-1') })

    expect(screen.queryByTestId('drag-overlay-card')).not.toBeInTheDocument()
  })
})
