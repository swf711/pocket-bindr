'use client'

import Link from 'next/link'
import { ArrowRight, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { BinderSummary, GRID_SHORT_LABELS } from '@/types/binder'
import { GridType } from '@prisma/client'

function isLightBackground(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b > 0.5
}

function getTextColor(hex: string): string {
  return isLightBackground(hex) ? '#1A202C' : '#F7FAFC'
}

interface BinderCoverCardProps {
  binder: BinderSummary
  onEdit: (binder: BinderSummary) => void
  onDelete: (binder: BinderSummary) => void
}

export function BinderCoverCard({ binder, onEdit, onDelete }: BinderCoverCardProps) {
  const textColor = getTextColor(binder.coverColor)
  const colorScheme = isLightBackground(binder.coverColor) ? 'light' : 'dark'
  const gridLabel = GRID_SHORT_LABELS[binder.gridType as GridType]
  const slotCount = binder._count.slots
  const dateStr = new Date(binder.createdAt).toLocaleDateString('zh-TW')

  return (
    <div
      data-testid="binder-card"
      className="group relative flex aspect-2.5/3.5 rounded-r-lg overflow-hidden shadow-sm transition-all hover:scale-105 hover:shadow-lg border"
      style={{ color: textColor, borderColor: textColor + '20' }}
    >
      {/* 書脊 */}
      <div
        data-testid="binder-spine"
        className="w-4 shrink-0"
        style={{ backgroundColor: binder.coverColor, filter: 'brightness(0.72)' }}
      />

      {/* 封面主體 */}
      <div className="flex-1 relative" style={{ backgroundColor: binder.coverColor }}>
        <div className="absolute top-1/4 left-2 right-2 text-center z-10 opacity-80">
          {/* 卡冊名稱：水印大字 */}
          <div
            data-testid="binder-name"
            className="text-xl font-bold truncate pointer-events-none"
          >
            {binder.name}
          </div>

          {/* 描述 */}
          <div
            data-testid="binder-description"
            className="text-center text-xs font-medium line-clamp-2 h-8 pointer-events-none"
          >
            {binder.description}
          </div>

          {/* 格式 + 卡數 */}
          <div
            data-testid="binder-info"
            className="pointer-events-none opacity-60 text-sm font-medium"
          >
            {gridLabel} · {slotCount} 張卡
          </div>

          {/* 建立日期 */}
          <div
            data-testid="binder-date"
            className="pointer-events-none opacity-60 text-xs"
          >
            {dateStr}
          </div>
        </div>

        {/* 操作按鈕：底部中間，hover 才顯示 */}
        <div className="absolute w-full bottom-4 flex justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ButtonGroup className={colorScheme}>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 shrink-0 text-xs active:not-aria-[haspopup]:translate-y-px"
              style={{ color: textColor }}
            >
              <Link
                href={`/binders/${binder.id}`}
                data-testid="enter-binder-btn"
                aria-label={`進入卡冊：${binder.name}`}
              >
                <ArrowRight className="h-3 w-3" />
                進入卡冊
              </Link>
            </Button>

            <Button
              variant="outline"
              size="icon"
              data-testid="edit-binder-btn"
              className="h-7 w-7 shrink-0 active:not-aria-[haspopup]:translate-y-px"
              onClick={() => onEdit(binder)}
              style={{ color: textColor }}
            >
              <Pencil className="h-3 w-3" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              data-testid="delete-binder-btn"
              className="h-7 w-7 shrink-0 active:not-aria-[haspopup]:translate-y-px"
              onClick={() => onDelete(binder)}
              style={{ color: textColor }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  )
}
