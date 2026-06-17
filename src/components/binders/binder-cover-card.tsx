'use client'

import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BinderSummary } from '@/types/binder'
import { GridType } from '@prisma/client'

const GRID_SHORT_LABELS: Record<GridType, string> = {
  grid_1x2: '1×2',
  grid_2x2: '2×2',
  grid_3x3: '3×3',
  grid_4x3: '4×3',
  grid_4x4: '4×4',
}

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

  return (
    <div
      data-testid="binder-card"
      className="group relative flex aspect-2.5/3.5 shadow-md rounded-r-lg overflow-hidden cursor-pointer"
      style={{ color: textColor, backgroundColor: binder.coverColor }}
    >
      {/* 書脊 */}
      <div
        data-testid="binder-spine"
        className="w-4 shrink-0"
        style={{ backgroundColor: binder.coverColor, filter: 'brightness(0.72)' }}
      />

      {/* 封面主體：Link 不含 action buttons（避免 button-in-anchor 非法 HTML） */}
      <Link
        data-testid="enter-binder-btn"
        href={`/binders/${binder.id}`}
        className="flex-1 p-2 flex flex-col gap-1"
        style={{ backgroundColor: binder.coverColor }}
      >
        <span className="text-sm font-bold leading-tight">{binder.name}</span>
        <span className="text-xs opacity-80">{GRID_SHORT_LABELS[binder.gridType as GridType]}</span>
        <span className="text-xs opacity-70">{binder._count.slots} 張卡</span>
        <span className="text-xs opacity-60">
          {new Date(binder.createdAt).toLocaleDateString('zh-TW')}
        </span>
      </Link>

      {/* edit/delete 圖示：absolute 定位在 Link 之外，hover 才顯示 */}
      <div
        className="absolute bottom-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ color: textColor }}
      >
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
    </div>
  )
}
