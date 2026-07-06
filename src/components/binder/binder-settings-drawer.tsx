'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { GridType } from '@prisma/client'
import { toast } from 'sonner'
import { Settings, Trash2, GripVertical, Copy, Share2 } from 'lucide-react'
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
import { PILL_TABS_LIST, PILL_TABS_TRIGGER } from '@/lib/tabs-styles'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { IconTooltipButton } from '@/components/common/icon-tooltip-button'
import { CoverColorPicker } from '@/components/binders/cover-color-picker'
import { GRID_SHORT_LABELS, GRID_TYPE_LABELS, type SlotWithCard, type BinderSettings } from '@/types/binder'

interface BinderSettingsDrawerProps {
  binderId: string
  binderName: string
  binderDescription: string | null
  gridType: GridType
  coverColor: string
  totalPages: number
  shareToken: string | null
  onSettingsUpdate: (updated: {
    name: string
    gridType: GridType
    coverColor: string
    description?: string | null
    newSlots?: SlotWithCard[]
    newTotalPages?: number
  }) => void
  onPageDelete: (pageNumber: number, newSlots: SlotWithCard[]) => void
  onPageReorder: (newSlots: SlotWithCard[]) => void
  onTotalPagesChange: (n: number) => void
  onShareTokenChange: (token: string | null) => void
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
  const t = useTranslations('binder.settingsDrawer')
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
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
          {...attributes}
          {...listeners}
          aria-label={t('dragPage', { page })}
          data-testid={`page-drag-handle-${page}`}
        >
          <GripVertical className="size-4" />
        </button>
        <span className="text-sm">{t('pageLabel', { page })}</span>
      </div>
      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                disabled={totalPages <= 1 || deletingPage === page}
                aria-label={t('deletePage', { page })}
                data-testid={`page-delete-btn-${page}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('deleteThisPage')}</p>
          </TooltipContent>
        </Tooltip>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deletePageConfirmTitle', { page })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deletePageConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(page)}
              data-testid={`page-delete-confirm-${page}`}
            >
              {t('delete')}
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
  shareToken: initialShareToken,
  onSettingsUpdate,
  onPageDelete,
  onPageReorder,
  onTotalPagesChange,
  onShareTokenChange,
}: BinderSettingsDrawerProps) {
  const t = useTranslations('binder.settingsDrawer')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(binderName)
  const [description, setDescription] = useState(binderDescription ?? '')
  const [localGridType, setLocalGridType] = useState<GridType>(gridType)
  const [localCoverColor, setLocalCoverColor] = useState(coverColor)
  const [savingSettings, setSavingSettings] = useState(false)
  const [deletingPage, setDeletingPage] = useState<number | null>(null)
  const [localShareToken, setLocalShareToken] = useState<string | null>(initialShareToken)
  const [sharingLoading, setSharingLoading] = useState(false)
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
        throw new Error(err?.error ?? t('updateFailed'))
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
          description: description || null,
          newSlots: refreshData.slots,
          newTotalPages,
        })
        toast(t('formatUpdated', { count: affectedSlotsCount, from: totalPages + 1, to: newTotalPages }))
      } else {
        onSettingsUpdate({ name, gridType: localGridType, coverColor: localCoverColor, description: description || null })
        toast(t('settingsSaved'))
      }
    } catch (err) {
      toast((err as Error).message)
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleEnableShare() {
    setSharingLoading(true)
    try {
      const res = await fetch(`/api/binders/${binderId}/share`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLocalShareToken(data.shareToken)
      onShareTokenChange(data.shareToken)
      toast(t('enableShareSuccess'))
    } catch {
      toast.error(t('enableShareFailed'))
    } finally {
      setSharingLoading(false)
    }
  }

  async function handleRevokeShare() {
    setSharingLoading(true)
    try {
      const res = await fetch(`/api/binders/${binderId}/share`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setLocalShareToken(null)
      onShareTokenChange(null)
      toast(t('revokeShareSuccess'))
    } catch {
      toast.error(t('revokeShareFailed'))
    } finally {
      setSharingLoading(false)
    }
  }

  async function handleCopyShareUrl() {
    if (!localShareToken) return
    const shareUrl = `${window.location.origin}/b/${localShareToken}`
    await navigator.clipboard.writeText(shareUrl)
    toast(t('linkCopied'))
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
      if (!res.ok) throw new Error(t('reorderFailed'))
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
        throw new Error(err?.error ?? t('deletePageFailed'))
      }
      const data = await res.json()
      onPageDelete(pageNumber, data.slots)
      onTotalPagesChange(data.totalPages)
      toast(t('pageDeleted', { page: pageNumber }))
    } catch (err) {
      toast((err as Error).message)
    } finally {
      setDeletingPage(null)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <Tooltip>
        <TooltipTrigger asChild>
          <DrawerTrigger asChild>
            <Button variant="outline" size="icon-lg" data-testid="binder-settings-btn" aria-label={t('binderSettings')}>
              <Settings className="size-5" />
            </Button>
          </DrawerTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('binderSettings')}</p>
        </TooltipContent>
      </Tooltip>
      <DrawerContent className="h-full w-80 right-0 left-auto">
        <DrawerHeader>
          <DrawerTitle>{t('binderSettings')}</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-6 p-4 overflow-y-auto">
          {/* 基本設定 */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="drawer-binder-name">{t('name')}</Label>
              <Input
                id="drawer-binder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                data-testid="drawer-binder-name-input"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="drawer-binder-description">{t('description')}</Label>
              <Textarea
                id="drawer-binder-description"
                placeholder={t('descriptionPlaceholder')}
                maxLength={150}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="drawer-binder-description-input"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t('format')}</Label>
              <Tabs
                value={localGridType}
                onValueChange={(v) => setLocalGridType(v as GridType)}
                data-testid="drawer-grid-tabs"
              >
                <TabsList className={cn(PILL_TABS_LIST, 'flex flex-wrap h-auto gap-1')}>
                  {(Object.keys(GRID_SHORT_LABELS) as GridType[]).map((gt) => (
                    <TabsTrigger
                      key={gt}
                      value={gt}
                      aria-label={GRID_TYPE_LABELS[gt]}
                      className={cn(PILL_TABS_TRIGGER, 'text-xs px-3')}
                    >
                      {GRID_SHORT_LABELS[gt]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t('coverColor')}</Label>
              <CoverColorPicker value={localCoverColor} onChange={setLocalCoverColor} />
            </div>

            <Button
              size="lg"
              onClick={handleSaveSettings}
              disabled={savingSettings || !name.trim()}
              data-testid="drawer-save-settings-btn"
            >
              {savingSettings ? t('saving') : t('saveSettings')}
            </Button>
          </div>

          <Separator />

          {/* 公開分享 */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Share2 className="size-4" />
              {t('publicShare')}
            </p>
            {localShareToken ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">{t('shareEnabledHint')}</p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/b/${localShareToken}`}
                    className="font-mono text-xs h-8"
                    data-testid="drawer-share-url-input"
                  />
                  <IconTooltipButton
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleCopyShareUrl}
                    tooltip={t('copyLink')}
                    data-testid="drawer-copy-share-url-btn"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </IconTooltipButton>
                </div>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleRevokeShare}
                  disabled={sharingLoading}
                  data-testid="drawer-revoke-share-btn"
                >
                  {t('revokeShare')}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">{t('shareDisabledHint')}</p>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleEnableShare}
                  disabled={sharingLoading}
                  data-testid="drawer-enable-share-btn"
                >
                  {t('enableShare')}
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* 內頁管理 */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{t('pageManagement')}</p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={pageOrder} strategy={verticalListSortingStrategy}>
                <ScrollArea className="max-h-64 rounded-md px-2 border">
                  <div className="flex flex-col py-2 gap-1" data-testid="page-manager-list">
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
                </ScrollArea>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
