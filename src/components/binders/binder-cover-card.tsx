'use client'

import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const textColor = getTextColor(binder.coverColor)

  return (
    <div
      data-testid="binder-card"
      className="rounded-lg overflow-hidden flex flex-col min-h-40 shadow-md"
      style={{ backgroundColor: binder.coverColor, color: textColor }}
    >
      <div className="flex-1 p-4 flex flex-col gap-1">
        <span className="text-lg font-bold leading-tight">{binder.name}</span>
        <span className="text-sm opacity-80">{GRID_SHORT_LABELS[binder.gridType as GridType]}</span>
        <span className="text-sm opacity-70">{binder._count.slots} 張卡</span>
      </div>
      <div
        className="flex gap-2 px-3 pb-3"
        style={{ color: textColor }}
      >
        <Button
          variant="secondary"
          size="sm"
          data-testid="enter-binder-btn"
          className="flex-1"
          onClick={() => router.push('/binders/' + binder.id)}
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: textColor, borderColor: 'transparent' }}
        >
          進入卡冊
        </Button>
        <Button
          variant="secondary"
          size="icon"
          data-testid="edit-binder-btn"
          onClick={() => onEdit(binder)}
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: textColor, borderColor: 'transparent' }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          data-testid="delete-binder-btn"
          onClick={() => onDelete(binder)}
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: textColor, borderColor: 'transparent' }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
