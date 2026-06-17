'use client'

import Link from 'next/link'
import { ArrowRight, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BinderSummary } from '@/types/binder'

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
      className="group relative flex aspect-2.5/3.5 rounded-r-lg overflow-hidden shadow-sm transition-all hover:scale-105 hover:shadow-lg"
      style={{ color: textColor, backgroundColor: binder.coverColor }}
    >
      {/* 書脊 */}
      <div
        data-testid="binder-spine"
        className="w-4 shrink-0"
        style={{ backgroundColor: binder.coverColor, filter: 'brightness(0.72)' }}
      />

      {/* 封面主體：純色背景，無 Link overlay */}
      <div
        className="flex-1"
        style={{ backgroundColor: binder.coverColor }}
      />

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

      {/* 卡冊名稱：左下角固定顯示 */}
      <span
        data-testid="binder-name"
        className="absolute bottom-2 left-2 text-sm font-bold leading-tight max-w-[calc(100%-1rem)] truncate z-10 pointer-events-none"
      >
        {binder.name}
      </span>
    </div>
  )
}
