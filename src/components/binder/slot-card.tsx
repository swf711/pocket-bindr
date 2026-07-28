'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { BookCheck, Bookmark, Copy, Eye, EllipsisVertical, Minimize2, Maximize2, Trash2 } from 'lucide-react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { isMultiNumberCard } from '@/lib/card-number'
import { getCardImageUrl } from '@/lib/get-card-image-url'
import { CardImage } from '../cards/card-image'
import { SpanCardImage } from './span-card-image'
import type { SlotWithCard } from '@/types/binder'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

interface SlotCardProps {
  slot: SlotWithCard
  onDelete: (slotId: string) => void
  onToggleStatus: (slotId: string) => void
  onView?: (cardId: string) => void
  onCopy?: (slotId: string) => void
  /** 複數卡切換「跨格 ↔ 單格」呈現；未傳則不顯示該按鈕 */
  onToggleSpan?: (slotId: string, mode: 'span' | 'single') => void
  isDragOverlay?: boolean
  isHighlighted?: boolean
  /** 剛從單格展開成跨格時播放一次進場動畫（避免每次載入頁面都動） */
  isExpanding?: boolean
  counterScale?: number
  isTapped?: boolean
  onTap?: () => void
  /** 小螢幕（行動裝置單頁 view）：格位過窄容不下橫排按鈕，僅保留切換狀態＋查看，其餘收進 ⋯ 選單 */
  compact?: boolean
}

export function SlotCard({
  slot,
  onDelete,
  onToggleStatus,
  onView,
  onCopy,
  onToggleSpan,
  isDragOverlay = false,
  isHighlighted = false,
  isExpanding = false,
  counterScale = 1,
  isTapped = false,
  onTap,
  compact = false,
}: SlotCardProps) {
  const t = useTranslations('binder.slotCard')
  const [open, setOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({ id: `slot-${slot.id}`, disabled: isDragOverlay })

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${slot.id}`,
    disabled: isDragOverlay,
  })

  const imageUrl = getCardImageUrl(slot.card.imageSmall)
  // 複數卡佔 1 格（未跨格）時顯示整張合成圖，比例非標準卡，object-cover 會裁成中央一條
  const objectFit = isMultiNumberCard(slot.card.cardNumber) ? 'object-contain' : 'object-cover'
  const canToggleSpan = onToggleSpan && isMultiNumberCard(slot.card.cardNumber)
  const toggleStatusLabel = slot.status === 'owned' ? t('switchToWanted') : t('switchToOwned')
  const spanLabel = slot.span ? t('collapseToSingleSlot') : t('expandAcrossSlots')
  const nameFallback = (
    <div className="flex h-full w-full flex-col items-center justify-center bg-muted text-muted-foreground">
      <span className="text-xs text-center px-1">{slot.card.name}</span>
    </div>
  )

  // 各操作按鈕抽成變數，桌面橫排與小螢幕精簡列共用（同時間只渲染一組，無重複 DOM/testid）
  const toggleStatusButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="default"
          size="icon-sm"
          onClick={() => onToggleStatus(slot.id)}
          aria-label={toggleStatusLabel}
        >
          {slot.status === 'owned' ? <Bookmark /> : <BookCheck />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{toggleStatusLabel}</p>
      </TooltipContent>
    </Tooltip>
  )

  const viewButton = onView ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="default"
          size="icon-sm"
          onClick={() => onView(slot.cardId)}
          data-testid={`slot-view-btn-${slot.id}`}
          aria-label={t('viewCard')}
        >
          <Eye />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t('viewCard')}</p>
      </TooltipContent>
    </Tooltip>
  ) : null

  return (
    <div
      ref={(node) => {
        setDragRef(node)
        setDropRef(node)
      }}
      {...attributes}
      {...listeners}
      data-testid={isDragOverlay ? 'drag-overlay-card' : `slot-card-${slot.id}`}
      onClick={!isDragOverlay && onTap ? (e) => { e.stopPropagation(); onTap() } : undefined}
      style={{ touchAction: 'none' }}
      className={`relative group w-full aspect-5/7 overflow-hidden rounded-md border border-border bg-card cursor-grab active:cursor-grabbing transition-opacity ${isDragging ? 'opacity-40' : 'opacity-100'
        } ${isOver && !isDragOverlay ? 'ring-2 ring-primary' : ''} ${isHighlighted ? 'ring-2 ring-primary animate-pulse' : ''
        } ${isExpanding ? 'animate-in fade-in zoom-in-90 duration-300 motion-reduce:animate-none' : ''}`}
    >
      {slot.span ? (
        <SpanCardImage
          src={slot.span.imageUrl ? getCardImageUrl(slot.span.imageUrl) : imageUrl}
          alt={slot.card.name}
          span={slot.span}
          grayscale={slot.status === 'wanted'}
          fallback={nameFallback}
        />
      ) : (
        <CardImage
          src={imageUrl}
          alt={slot.card.name}
          className={`h-full w-full ${objectFit}${slot.status === 'wanted' ? ' grayscale' : ''}`}
          loading="lazy"
          draggable={false}
          fallback={nameFallback}
        />
      )}

      {/* 操作按鈕 overlay — ButtonGroup 底部中央，counter-scale 保持自然視覺尺寸；桌面 hover 顯示，行動裝置 tap 顯示 */}
      {!isDragOverlay && (
        <div className={`absolute inset-0 flex items-end justify-center pb-2 transition-opacity pointer-events-none ${isTapped ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div
            style={{ transform: `scale(${counterScale})`, transformOrigin: 'bottom center' }}
            className={isTapped ? 'pointer-events-auto' : 'pointer-events-none group-hover:pointer-events-auto'}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {compact ? (
              // 小螢幕：切換狀態＋查看 inline，其餘收進 ⋯ 選單，避免橫排按鈕溢出窄格位
              <ButtonGroup>
                {toggleStatusButton}
                {viewButton}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="default"
                      size="icon-sm"
                      data-testid={`slot-more-btn-${slot.id}`}
                      aria-label={t('moreActions')}
                    >
                      <EllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="min-w-[140px]">
                    {canToggleSpan && (
                      <DropdownMenuItem
                        onSelect={() => onToggleSpan!(slot.id, slot.span ? 'single' : 'span')}
                        data-testid={`slot-span-menu-${slot.id}`}
                      >
                        {slot.span ? <Minimize2 className="mr-2 size-4" /> : <Maximize2 className="mr-2 size-4" />}
                        {spanLabel}
                      </DropdownMenuItem>
                    )}
                    {onCopy && (
                      <DropdownMenuItem
                        onSelect={() => onCopy(slot.id)}
                        data-testid={`slot-copy-menu-${slot.id}`}
                      >
                        <Copy className="mr-2 size-4" />
                        {t('copyToEmptySlot')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      // dialog 不可 nested 於選單項（選單關閉會連帶 unmount）；preventDefault 讓選單先關再開受控 dialog
                      onSelect={(e) => { e.preventDefault(); setOpen(true) }}
                      data-testid={`slot-remove-menu-${slot.id}`}
                    >
                      <Trash2 className="mr-2 size-4" />
                      {t('removeCard')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </ButtonGroup>
            ) : (
              // 桌面/大螢幕：全部操作橫排，固定序 切換狀態→查看→跨格→複製→刪除
              <ButtonGroup>
                {toggleStatusButton}
                {viewButton}
                {canToggleSpan && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="default"
                        size="icon-sm"
                        onClick={() => onToggleSpan!(slot.id, slot.span ? 'single' : 'span')}
                        data-testid={`slot-span-btn-${slot.id}`}
                        aria-label={spanLabel}
                      >
                        {slot.span ? <Minimize2 /> : <Maximize2 />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{spanLabel}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {onCopy && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="default"
                        size="icon-sm"
                        onClick={() => onCopy(slot.id)}
                        data-testid={`slot-copy-btn-${slot.id}`}
                        aria-label={t('copyToEmptySlot')}
                      >
                        <Copy />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('copyToEmptySlot')}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="icon-sm"
                      data-variant="destructive"
                      onClick={() => setOpen(true)}
                      data-testid={`slot-remove-btn-${slot.id}`}
                      aria-label={t('removeCard')}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/50"
                    >
                      <Trash2 />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('removeCard')}</p>
                  </TooltipContent>
                </Tooltip>
              </ButtonGroup>
            )}
          </div>
        </div>
      )}

      {/* 刪除確認 — 單一受控 AlertDialog，供桌面刪除鈕與小螢幕 ⋯ 選單刪除項共用（不 nested 於 trigger/選單項） */}
      {!isDragOverlay && (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-error-container text-on-error-container">
                <Trash2 />
              </AlertDialogMedia>
              <AlertDialogTitle>{t('removeCard')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('removeCardConfirm', { cardName: slot.card.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel variant="outline" size="lg" className="rounded-full!">
                {t('cancel')}
              </AlertDialogCancel>
              <Button
                variant="destructive"
                size="lg"
                onClick={() => onDelete(slot.id)}
              >
                {t('confirmRemove')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
