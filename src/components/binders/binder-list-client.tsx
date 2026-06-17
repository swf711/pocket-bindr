'use client'

import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { BinderSummary } from '@/types/binder'
import { cardGridClassName } from '@/components/cards/card-grid'
import { MAX_BINDERS_PER_USER } from '@/lib/binder-limits'
import { BinderCoverCard } from './binder-cover-card'
import { AddBinderSlot } from './add-binder-slot'
import { CreateBinderDialog } from './create-binder-dialog'
import { EditBinderDialog } from './edit-binder-dialog'
import { DeleteBinderDialog } from './delete-binder-dialog'

interface BinderListClientProps {
  initialBinders: BinderSummary[]
}

export function BinderListClient({ initialBinders }: BinderListClientProps) {
  const [binderList, setBinderList] = useState<BinderSummary[]>(initialBinders)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedBinder, setSelectedBinder] = useState<BinderSummary | null>(null)

  function handleCreated(binder: BinderSummary) {
    setBinderList(prev => [binder, ...prev])
    toast('卡冊已建立')
  }

  function handleUpdated(binder: BinderSummary) {
    setBinderList(prev => prev.map(b => (b.id === binder.id ? binder : b)))
    toast('卡冊已更新')
  }

  function handleDeleted(id: string) {
    setBinderList(prev => prev.filter(b => b.id !== id))
    toast('卡冊已刪除')
  }

  function openEdit(binder: BinderSummary) {
    setSelectedBinder(binder)
    setEditOpen(true)
  }

  function openDelete(binder: BinderSummary) {
    setSelectedBinder(binder)
    setDeleteOpen(true)
  }

  const canAddMore = binderList.length < MAX_BINDERS_PER_USER

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">我的卡冊</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {binderList.length} / {MAX_BINDERS_PER_USER} 本
          </span>
          <Progress
            value={(binderList.length / MAX_BINDERS_PER_USER) * 100}
            className="w-24 h-2"
          />
        </div>
      </div>

      {binderList.length === 0 ? (
        <Empty data-testid="empty-binder-state">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpen />
            </EmptyMedia>
            <EmptyTitle>還沒有卡冊</EmptyTitle>
            <EmptyDescription>建立你的第一本卡冊來整理收藏</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setCreateOpen(true)}>建立第一本卡冊</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className={cardGridClassName}>
          {binderList.map(binder => (
            <BinderCoverCard
              key={binder.id}
              binder={binder}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          ))}
          {canAddMore && <AddBinderSlot onClick={() => setCreateOpen(true)} />}
        </div>
      )}

      <CreateBinderDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />

      <EditBinderDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        binder={selectedBinder}
        onUpdated={handleUpdated}
      />

      <DeleteBinderDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        binder={selectedBinder}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
