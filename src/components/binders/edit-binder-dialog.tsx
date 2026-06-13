'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { GridType } from '@prisma/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BinderSummary, PatchBinderResponse, GRID_TYPE_LABELS } from '@/types/binder'
import { DEFAULT_COVER_COLOR } from '@/lib/cover-colors'
import { CoverColorPicker } from './cover-color-picker'

interface EditBinderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  binder: BinderSummary | null
  onUpdated: (binder: BinderSummary) => void
}

export function EditBinderDialog({
  open,
  onOpenChange,
  binder,
  onUpdated,
}: EditBinderDialogProps) {
  const [name, setName] = useState('')
  const [gridType, setGridType] = useState<GridType>('grid_3x3')
  const [coverColor, setCoverColor] = useState(DEFAULT_COVER_COLOR)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (binder) {
      setName(binder.name)
      setGridType(binder.gridType as GridType)
      setCoverColor(binder.coverColor ?? DEFAULT_COVER_COLOR)
    }
  }, [binder])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!binder) return
    setLoading(true)
    try {
      const res = await fetch(`/api/binders/${binder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, gridType, coverColor }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? '更新失敗')
      }
      const data: PatchBinderResponse = await res.json()
      if (data.affectedSlotsCount && data.affectedSlotsCount > 0) {
        toast(`格式已更新，${data.affectedSlotsCount} 張卡片已搬移至新頁`)
      }
      onUpdated(data as unknown as BinderSummary)
      onOpenChange(false)
    } catch (err) {
      toast((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="edit-binder-dialog">
        <DialogHeader>
          <DialogTitle>編輯卡冊</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-binder-name">名稱</Label>
            <Input
              id="edit-binder-name"
              placeholder="卡冊名稱"
              maxLength={50}
              value={name}
              onChange={e => setName(e.target.value)}
              data-testid="binder-name-input"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-binder-grid">格式</Label>
            <Select
              value={gridType}
              onValueChange={v => setGridType(v as GridType)}
            >
              <SelectTrigger id="edit-binder-grid" data-testid="binder-grid-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(GRID_TYPE_LABELS) as [GridType, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>封面顏色</Label>
            <CoverColorPicker value={coverColor} onChange={setCoverColor} />
          </div>
          <Button
            type="submit"
            disabled={loading}
            data-testid="edit-binder-submit"
          >
            {loading ? '儲存中…' : '儲存'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
