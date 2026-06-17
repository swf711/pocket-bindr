'use client'

import Link from 'next/link'
import { Info, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { BinderSummary } from '@/types/binder'
import { GridType } from '@prisma/client'

const GRID_SHORT_LABELS: Record<GridType, string> = {
  grid_1x2: '1×2',
  grid_2x2: '2×2',
  grid_3x3: '3×3',
  grid_4x3: '4×3',
  grid_4x4: '4×4',
}

const GRID_FULL_LABELS: Record<GridType, string> = {
  grid_1x2: '1 × 2（每頁 2 格）',
  grid_2x2: '2 × 2（每頁 4 格）',
  grid_3x3: '3 × 3（每頁 9 格）',
  grid_4x3: '4 × 3（每頁 12 格）',
  grid_4x4: '4 × 4（每頁 16 格）',
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
      className="group relative flex aspect-2.5/3.5 rounded-r-lg overflow-hidden cursor-pointer shadow-sm transition-all hover:scale-105 hover:shadow-lg"
      style={{ color: textColor, backgroundColor: binder.coverColor }}
    >
      {/* 書脊 */}
      <div
        data-testid="binder-spine"
        className="w-4 shrink-0"
        style={{ backgroundColor: binder.coverColor, filter: 'brightness(0.72)' }}
      />

      {/* 封面主體：Link 作為透明 overlay，不含子互動元素 */}
      <Link
        data-testid="enter-binder-btn"
        href={`/binders/${binder.id}`}
        className="flex-1"
        aria-label={`進入卡冊：${binder.name}`}
        style={{ backgroundColor: binder.coverColor }}
      />

      {/* 操作按鈕：右上角，hover 才顯示 */}
      <div
        className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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

      {/* 卡冊名稱：左下角固定顯示 */}
      <span
        data-testid="binder-name"
        className="absolute bottom-2 left-2 text-sm font-bold leading-tight max-w-[calc(100%-3rem)] truncate z-10 pointer-events-none"
      >
        {binder.name}
      </span>

      {/* HoverCard 觸發器：右下角，顯示二級資訊 */}
      <HoverCard openDelay={300} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button
            data-testid="binder-info-btn"
            className="absolute bottom-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full opacity-60 hover:opacity-100 transition-opacity"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: textColor }}
            aria-label={`${binder.name} 詳細資訊`}
          >
            <Info className="h-3 w-3" />
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-48 p-3 text-sm" side="right" align="end">
          <div className="space-y-1">
            <p className="font-semibold truncate">{binder.name}</p>
            <p className="text-muted-foreground">{GRID_FULL_LABELS[binder.gridType as GridType]}</p>
            <p className="text-muted-foreground">{binder._count.slots} 張卡</p>
            <p className="text-muted-foreground">
              {new Date(binder.createdAt).toLocaleDateString('zh-TW')}
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}
