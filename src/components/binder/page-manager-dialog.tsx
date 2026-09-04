'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { GridType } from '@prisma/client'
import { toast } from 'sonner'
import { ArrowRight, LayoutGrid, Trash2 } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DialogHeaderClose } from '@/components/common/dialog-header-close'
import { IconTooltipButton } from '@/components/common/icon-tooltip-button'
import { PagePreviewGrid } from './page-preview-grid'
import { buildGridPages } from '@/lib/binder-utils'
import { useHasNoHover } from '@/hooks/use-has-hover'
import { cn } from '@/lib/utils'
import type { BinderSlotItem, SlotWithCard } from '@/types/binder'

interface PageManagerDialogProps {
  binderId: string
  gridType: GridType
  totalPages: number
  slots: SlotWithCard[]
  onPageDelete: (pageNumber: number, newSlots: SlotWithCard[]) => void
  onPageReorder: (newSlots: SlotWithCard[]) => void
  onTotalPagesChange: (n: number) => void
  onJumpToPage: (pageNumber: number) => void
}

function SortablePageCard({
  page,
  items,
  gridType,
  totalPages,
  deletingPage,
  showActions,
  onDelete,
  onJump,
}: {
  page: number
  items: BinderSlotItem[]
  gridType: GridType
  totalPages: number
  deletingPage: number | null
  /** 觸控裝置無 hover，操作按鈕改常駐 */
  showActions: boolean
  onDelete: (page: number) => Promise<boolean>
  onJump: (page: number) => void
}) {
  const t = useTranslations('binder.pageManager')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page,
    // dnd-kit 預設給 role="button"，但卡片內含真實 <button>（跳頁／刪除）＝巢狀互動元素。
    // 改成 group 保留 tabIndex（鍵盤重排仍可用）又不謊報成按鈕。
    attributes: { role: 'group' },
  })

  const actionVisibility = showActions
    ? 'opacity-100'
    : 'opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100'

  return (
    // 整張卡片可拖曳（沒有獨立把手）。點擊語意改由下方 overlay 的兩顆按鈕承擔，
    // 拖曳 / 點擊的分辨交給 sensor 的 activationConstraint（見下方 useSensors）。
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      {...attributes}
      {...listeners}
      className="group relative flex cursor-grab flex-col items-center gap-2 rounded-lg border bg-card p-2 active:cursor-grabbing"
      data-testid={`page-manager-row-${page}`}
    >
      <PagePreviewGrid items={items} gridType={gridType} page={page} />
      <span className="text-xs font-medium">{t('pageLabel', { page })}</span>

      {/* 操作按鈕 overlay — 底部中央，比照 slot-card.tsx 的既有模式 */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 flex items-end justify-center pb-7',
          actionVisibility,
        )}
      >
        <div
          className="pointer-events-auto"
          // 🔴 沒有這行，按在按鈕上會先觸發卡片根元素的拖曳 listener
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ButtonGroup>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="icon-sm"
                  onClick={() => onJump(page)}
                  data-testid={`page-jump-btn-${page}`}
                  aria-label={t('jumpToPage', { page })}
                >
                  <ArrowRight />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('jumpToPage', { page })}</p>
              </TooltipContent>
            </Tooltip>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="default"
                      size="icon-sm"
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/50"
                      disabled={totalPages <= 1 || deletingPage === page}
                      aria-label={t('deletePage', { page })}
                      data-testid={`page-delete-btn-${page}`}
                    >
                      <Trash2 />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('deleteThisPage')}</p>
                </TooltipContent>
              </Tooltip>
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogMedia className="bg-error-container text-on-error-container">
                    <Trash2 />
                  </AlertDialogMedia>
                  <AlertDialogTitle>{t('deletePageConfirmTitle', { page })}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('deletePageConfirmDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    variant="outline"
                    size="lg"
                    className="rounded-full!"
                    disabled={deletingPage === page}
                  >
                    {t('cancel')}
                  </AlertDialogCancel>
                  <Button
                    variant="destructive"
                    size="lg"
                    disabled={deletingPage === page}
                    onClick={async () => {
                      const success = await onDelete(page)
                      if (success) setConfirmOpen(false)
                    }}
                    data-testid={`page-delete-confirm-${page}`}
                  >
                    {deletingPage === page ? t('deleting') : t('delete')}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </ButtonGroup>
        </div>
      </div>
    </div>
  )
}

/**
 * 「管理內頁」Dialog：重排 / 刪除 / 跳頁。
 *
 * 刻意**不放在設定 Drawer 裡**——Drawer 固定 w-80，縮圖寬度天花板約 48px，
 * 3×3 每格只剩 11×15px 根本認不出是哪一頁；且 Drawer 內再開 Dialog 會有
 * focus trap 互搶與關閉順序問題。改由卡冊 header 直接觸發，版面才放得下大縮圖。
 *
 * 重排用 `rectSortingStrategy`（2D grid）而非 `verticalListSortingStrategy`；
 * 送出的仍是既有的 `newOrder: number[]`，API 完全未變。
 * ⚠️ 2D 的 coordinate getter 讓鍵盤方向鍵語意改變：`ArrowUp` 是「上一列」而非「上一個位置」。
 */
export function PageManagerDialog({
  binderId,
  gridType,
  totalPages,
  slots,
  onPageDelete,
  onPageReorder,
  onTotalPagesChange,
  onJumpToPage,
}: PageManagerDialogProps) {
  const t = useTranslations('binder.pageManager')
  const [open, setOpen] = useState(false)
  const [deletingPage, setDeletingPage] = useState<number | null>(null)
  const [pageOrder, setPageOrder] = useState<number[]>(() =>
    Array.from({ length: totalPages }, (_, i) => i + 1),
  )
  const noHover = useHasNoHover()

  useEffect(() => {
    setPageOrder(Array.from({ length: totalPages }, (_, i) => i + 1))
  }, [totalPages])

  // 縮圖排版用已存檔的 gridType，格線與實際格位資料才不會錯位
  const pages = buildGridPages(slots, gridType, totalPages)

  // 🔴 整張卡片可拖 + 卡片位於可捲動的 ScrollArea 內，故 sensor 必須帶 activationConstraint：
  //   - 滑鼠：移動 8px 才算拖曳，小於此仍是點擊（overlay 按鈕才按得到）
  //   - 觸控：長按 200ms 才進入拖曳，短觸與直向滑動仍是捲動清單
  // 刻意**不**照抄 slot-card.tsx 的 `touchAction: 'none'`——那是不可捲動的格線，
  // 用在這裡會讓手指按在任一張卡上就捲不動，100 頁時等於整個清單卡死。
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = pageOrder.indexOf(active.id as number)
    const newIndex = pageOrder.indexOf(over.id as number)
    const newOrder = arrayMove(pageOrder, oldIndex, newIndex)
    setPageOrder(newOrder)

    const reset = () => setPageOrder(Array.from({ length: totalPages }, (_, i) => i + 1))
    try {
      const res = await fetch(`/api/binders/${binderId}/pages/reorder-bulk`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOrder }),
      })
      if (!res.ok) throw new Error(t('reorderFailed'))
      const data = await res.json()
      onPageReorder(data.slots)
      reset()
    } catch {
      toast.error(t('reorderFailed'))
      reset()
    }
  }

  async function handleDeletePage(pageNumber: number): Promise<boolean> {
    setDeletingPage(pageNumber)
    try {
      const res = await fetch(`/api/binders/${binderId}/pages/${pageNumber}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? t('deletePageFailed'))
      }
      const data = await res.json()
      onPageDelete(pageNumber, data.slots)
      onTotalPagesChange(data.totalPages)
      toast.success(t('pageDeleted', { page: pageNumber }))
      return true
    } catch {
      toast.error(t('deletePageFailed'))
      return false
    } finally {
      setDeletingPage(null)
    }
  }

  function handleJump(page: number) {
    setOpen(false)
    onJumpToPage(page)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <IconTooltipButton
          variant="outline"
          size="icon-lg"
          tooltip={t('title')}
          data-testid="page-manager-btn"
        >
          {/* size-5 = M3 --m3-icon(20px)，與同排的重整／設定齒輪一致 */}
          <LayoutGrid className="size-5" />
        </IconTooltipButton>
      </DialogTrigger>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-[calc(100%-2rem)] lg:max-w-5xl"
        data-testid="page-manager-dialog"
        showCloseButton={false}
      >
        <DialogHeaderClose className="border-b px-6 py-4">
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeaderClose>

        <ScrollArea className="max-h-[calc(85vh-4.5rem)]">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pageOrder} strategy={rectSortingStrategy}>
              <div
                className="grid grid-cols-2 gap-3 px-6 py-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
                data-testid="page-manager-list"
              >
                {pageOrder.map((page) => (
                  <SortablePageCard
                    key={page}
                    page={page}
                    items={pages.get(page) ?? []}
                    gridType={gridType}
                    totalPages={totalPages}
                    deletingPage={deletingPage}
                    showActions={noHover}
                    onDelete={handleDeletePage}
                    onJump={handleJump}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
