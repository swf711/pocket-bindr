import type { DragCancelEvent, DragEndEvent, DragStartEvent } from '@dnd-kit/core'

/**
 * dnd-kit 的取消拖曳（Esc / pointercancel）只觸發 `onDragCancel`，不觸發 `onDragEnd`。
 * jsdom 下無法真實驅動 sensor 產生該事件，故測試改以「攔截 DndContext 的 handler props」
 * 直接呼叫，驗證元件確實把重置邏輯接到 `onDragCancel` 上。
 *
 * 用法（各測試檔內 hoisted 的 vi.mock，包裝而非取代真正的 DndContext，
 * 讓 @dnd-kit/sortable 的 context 仍正常運作）：
 *
 * vi.mock('@dnd-kit/core', async (importOriginal) => {
 *   const actual = await importOriginal<typeof import('@dnd-kit/core')>()
 *   const { captureDndHandlers } = await import('<path>/dnd-capture')
 *   return {
 *     ...actual,
 *     DndContext: (props: React.ComponentProps<typeof actual.DndContext>) => {
 *       captureDndHandlers(props)
 *       return createElement(actual.DndContext, props)
 *     },
 *   }
 * })
 */
export interface CapturedDndHandlers {
  id?: string
  onDragStart?: (event: DragStartEvent) => void
  onDragCancel?: (event: DragCancelEvent) => void
  onDragEnd?: (event: DragEndEvent) => void
}

const captured = new Map<string, CapturedDndHandlers>()

export function captureDndHandlers(props: CapturedDndHandlers) {
  captured.set(props.id ?? 'default', props)
}

export function resetCapturedDndHandlers() {
  captured.clear()
}

export function getDndHandlers(id: string): CapturedDndHandlers {
  const handlers = captured.get(id)
  if (!handlers) {
    throw new Error(
      `No DndContext captured for id "${id}". Captured: ${[...captured.keys()].join(', ') || '(none)'}`,
    )
  }
  return handlers
}

/** 觸發被攔截的 onDragStart；event 只帶元件實際會讀到的欄位。 */
export function fireDragStart(id: string, activeId: string) {
  const { onDragStart } = getDndHandlers(id)
  if (!onDragStart) throw new Error(`DndContext "${id}" has no onDragStart`)
  onDragStart({ active: { id: activeId } } as unknown as DragStartEvent)
}

/** 觸發被攔截的 onDragCancel——本檔存在的理由：這條接線正是被測目標。 */
export function fireDragCancel(id: string, activeId: string) {
  const { onDragCancel } = getDndHandlers(id)
  if (!onDragCancel) {
    throw new Error(`DndContext "${id}" has no onDragCancel — cancelled drags will leak state`)
  }
  onDragCancel({ active: { id: activeId } } as unknown as DragCancelEvent)
}
