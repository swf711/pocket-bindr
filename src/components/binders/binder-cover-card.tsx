'use client'

import Link from 'next/link'
import { ArrowRight, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BinderSummary, GRID_SHORT_LABELS } from '@/types/binder'
import { GridType } from '@prisma/client'

function getTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b
  return luminance > 0.5 ? '#1A202C' : '#F7FAFC'
}

interface BinderCoverCardProps {
  binder: BinderSummary
  onEdit: (binder: BinderSummary) => void
  onDelete: (binder: BinderSummary) => void
}

export function BinderCoverCard({ binder, onEdit, onDelete }: BinderCoverCardProps) {
  const textColor = getTextColor(binder.coverColor)
  const gridLabel = GRID_SHORT_LABELS[binder.gridType as GridType]
  const slotCount = binder._count.slots
  const dateStr = new Date(binder.createdAt).toLocaleDateString('zh-TW')

  return (
    <div
      data-testid="binder-card"
      className="group relative flex aspect-2.5/3.5 rounded-r-lg overflow-hidden shadow-sm transition-all hover:scale-105 hover:shadow-lg border"
      style={{ color: textColor, backgroundColor: binder.coverColor, borderColor: textColor + '20' }}
    >
      {/* 書脊 */}
      <div
        data-testid="binder-spine"
        className="w-4 shrink-0"
        style={{ backgroundColor: binder.coverColor, filter: 'brightness(0.72)' }}
      />

      {/* 封面主體 */}
      <div className="flex-1 relative" style={{ backgroundColor: binder.coverColor }} />

      {/* 操作按鈕：右上角，hover 才顯示 */}
      <div
        className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ color: textColor }}
      >
        <Button
          asChild
          variant="secondary"
          size="icon"
          className="h-6 w-6 shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'transparent' }}
        >
          <Link
            href={`/binders/${binder.id}`}
            data-testid="enter-binder-btn"
            aria-label={`進入卡冊：${binder.name}`}
            style={{ color: textColor }}
          >
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
        <Button
          variant="secondary"
          size="icon"
          data-testid="edit-binder-btn"
          className="h-6 w-6 shrink-0"
          onClick={() => onEdit(binder)}
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: textColor, borderColor: 'transparent' }}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          data-testid="delete-binder-btn"
          className="h-6 w-6 shrink-0"
          onClick={() => onDelete(binder)}
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: textColor, borderColor: 'transparent' }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* 卡冊名稱：水印大字 */}
      <div
        data-testid="binder-name"
        className="absolute top-20 left-6 right-2 text-center text-xl font-bold truncate z-10 pointer-events-none opacity-80"
      >
        {binder.name}
      </div>

      {/* 描述：若有，顯示在名稱下方 */}
      {binder.description && (
        <div
          data-testid="binder-description"
          className="absolute top-27 left-6 right-3 text-center text-xs font-medium line-clamp-2 z-10 pointer-events-none opacity-80"
        >
          {binder.description}
        </div>
      )}

      {/* 格式 + 卡數：左下角 */}
      <div
        data-testid="binder-info"
        className="absolute bottom-5 left-6 z-10 pointer-events-none opacity-50 text-xs font-medium"
      >
        {gridLabel} · {slotCount} 張卡
      </div>

      {/* 建立日期 */}
      <div
        data-testid="binder-date"
        className="absolute bottom-2 left-6 z-10 pointer-events-none opacity-40 text-[10px]"
      >
        {dateStr}
      </div>
    </div>
  )
}
