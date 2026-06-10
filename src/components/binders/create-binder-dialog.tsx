'use client'

import { useState } from 'react'
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
import { BinderSummary, GRID_TYPE_LABELS } from '@/types/binder'

interface CreateBinderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (binder: BinderSummary) => void
}

export function CreateBinderDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateBinderDialogProps) {
  const [name, setName] = useState('')
  const [gridType, setGridType] = useState<GridType>('grid_3x3')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/binders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, gridType }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? '建立失敗')
      }
      const data: BinderSummary = await res.json()
      onCreated(data)
      setName('')
      setGridType('grid_3x3')
      onOpenChange(false)
    } catch (err) {
      toast((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增卡冊</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="binder-name">名稱</Label>
            <Input
              id="binder-name"
              placeholder="卡冊名稱"
              maxLength={50}
              value={name}
              onChange={e => setName(e.target.value)}
              data-testid="binder-name-input"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="binder-grid">格式</Label>
            <Select
              value={gridType}
              onValueChange={v => setGridType(v as GridType)}
            >
              <SelectTrigger id="binder-grid" data-testid="binder-grid-select">
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
          <Button
            type="submit"
            disabled={loading}
            data-testid="create-binder-submit"
          >
            {loading ? '建立中…' : '建立'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
