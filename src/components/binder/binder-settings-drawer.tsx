'use client'

import { useState, useEffect } from 'react'
import { GridType } from '@prisma/client'
import { toast } from 'sonner'
import { Settings, Trash2, GripVertical } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { CoverColorPicker } from '@/components/binders/cover-color-picker'
import { GRID_SHORT_LABELS, GRID_TYPE_LABELS, type SlotWithCard, type BinderSettings } from '@/types/binder'

interface BinderSettingsDrawerProps {
  binderId: string
  binderName: string
  binderDescription: string | null
  gridType: GridType
  coverColor: string
  totalPages: number
  onSettingsUpdate: (updated: {
    name: string
    gridType: GridType
    coverColor: string
    newSlots?: SlotWithCard[]
    newTotalPages?: number
  }) => void
  onPageDelete: (pageNumber: number, newSlots: SlotWithCard[]) => void
  onPageReorder: (newSlots: SlotWithCard[]) => void
  onTotalPagesChange: (n: number) => void
}

function SortablePageRow({
  page,
  totalPages,
  deletingPage,
  onDelete,
}: {
  page: number
  totalPages: number
  deletingPage: number | null
  onDelete: (page: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-md border px-3 py-2 bg-background"
      data-testid={`page-manager-row-${page}`}
    >
      <div className="flex items-center gap-2">
        <button
          className="cursor-grab text-muted-foreground hover:text-foreground touch-none"
          {...attributes}
          {...listeners}
          aria-label={`拖拉第 ${page} 頁`}
          data-testid={`page-drag-handle-${page}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-sm">第 {page} 頁</span>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            disabled={totalPages <= 1 || deletingPage === page}
            aria-label={`刪除第 ${page} 頁`}
            data-testid={`page-delete-btn-${page}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除第 {page} 頁？</AlertDialogTitle>
            <AlertDialogDescription>
              此頁上的所有卡牌將從卡冊中移除，後續頁碼將自動重新編號。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(page)}
              data-testid={`page-delete-confirm-${page}`}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function BinderSettingsDrawer({
  binderId,
  binderName,
  binderDescription,
  gridType,
  coverColor,
  totalPages,
  onSettingsUpdate,
  onPageDelete,
  onPageReorder,
  onTotalPagesChange,
}: BinderSettingsDrawerProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(binderName)
  const [description, setDescription] = useState(binderDescription ?? '')
  const [localGridType, setLocalGridType] = useState<GridType>(gridType)
  const [localCoverColor, setLocalCoverColor] = useState(coverColor)
  const [savingSettings, setSavingSettings] = useState(false)
  const [deletingPage, setDeletingPage] = useState<number | null>(null)
  const [pageOrder, setPageOrder] = useState<number[]>(() =>
    Array.from({ length: totalPages }, (_, i) => i + 1),
  )

  useEffect(() => {
    setPageOrder(Array.from({ length: totalPages }, (_, i) => i + 1))
  }, [totalPages])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function handleSaveSettings() {
    setSavingSettings(true)
    try {
      const res = await fetch(`/api/binders/${binderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          gridType: localGridType,
          coverColor: localCoverColor,
          description: description || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? '更新失敗')
      }
      const data = await res.json()
      const affectedSlotsCount: number = data.affectedSlotsCount ?? 0

      if (affectedSlotsCount > 0) {
        const newTotalPages = (data.settings as BinderSettings | null)?.totalPages ?? totalPages
        const refreshRes = await fetch(`/api/binders/${binderId}`)
        const refreshData = await refreshRes.json()
        onSettingsUpdate({
          name,
          gridType: localGridType,
          coverColor: localCoverColor,
          newSlots: refreshData.slots,
          newTotalPages,
        })
        toast(`格式已更新，${affectedSlotsCount} 張卡牌已搬移至第 ${totalPages + 1}～${newTotalPages} 頁`)
      } else {
        onSettingsUpdate({ name, gridType: localGridType, coverColor: localCoverColor })
        toast('設定已儲存')
      }
    } catch (err) {
      toast((err as Error).message)
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = pageOrder.indexOf(active.id as number)
    const newIndex = pageOrder.indexOf(over.id as number)
    const newOrder = arrayMove(pageOrder, oldIndex, newIndex)
    setPageOrder(newOrder)

    try {
      const res = await fetch(`/api/binders/${binderId}/pages/reorder-bulk`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOrder }),
      })
      if (!res.ok) throw new Error('重排失敗')
      const data = await res.json()
      onPageReorder(data.slots)
      setPageOrder(Array.from({ length: totalPages }, (_, i) => i + 1))
    } catch (err) {
      toast((err as Error).message)
      setPageOrder(Array.from({ length: totalPages }, (_, i) => i + 1))
    }
  }

  async function handleDeletePage(pageNumber: number) {
    setDeletingPage(pageNumber)
    try {
      const res = await fetch(`/api/binders/${binderId}/pages/${pageNumber}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? '刪除失敗')
      }
      const data = await res.json()
      onPageDelete(pageNumber, data.slots)
      onTotalPagesChange(data.totalPages)
      toast(`第 ${pageNumber} 頁已刪除`)
    } catch (err) {
      toast((err as Error).message)
    } finally {
      setDeletingPage(null)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="binder-settings-btn" aria-label="卡冊設定">
          <Settings className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-full w-80 right-0 left-auto">
        <DrawerHeader>
          <DrawerTitle>卡冊設定</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-6 p-4 overflow-y-auto">
          {/* 基本設定 */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="drawer-binder-name">名稱</Label>
              <Input
                id="drawer-binder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                data-testid="drawer-binder-name-input"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="drawer-binder-description">描述（選填）</Label>
              <Textarea
                id="drawer-binder-description"
                placeholder="選填，最多 150 字"
                maxLength={150}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="drawer-binder-description-input"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>格式</Label>
              <Tabs
                value={localGridType}
                onValueChange={(v) => setLocalGridType(v as GridType)}
                data-testid="drawer-grid-tabs"
              >
                <TabsList className="flex flex-wrap h-auto gap-1">
                  {(Object.keys(GRID_SHORT_LABELS) as GridType[]).map((gt) => (
                    <TabsTrigger
                      key={gt}
                      value={gt}
                      aria-label={GRID_TYPE_LABELS[gt]}
                      className="text-xs px-3"
                    >
                      {GRID_SHORT_LABELS[gt]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>封面顏色</Label>
              <CoverColorPicker value={localCoverColor} onChange={setLocalCoverColor} />
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={savingSettings || !name.trim()}
              data-testid="drawer-save-settings-btn"
            >
              {savingSettings ? '儲存中…' : '儲存設定'}
            </Button>
          </div>

          <Separator />

          {/* 內頁管理 */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">內頁管理</p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={pageOrder} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-1" data-testid="page-manager-list">
                  {pageOrder.map((page) => (
                    <SortablePageRow
                      key={page}
                      page={page}
                      totalPages={totalPages}
                      deletingPage={deletingPage}
                      onDelete={handleDeletePage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
