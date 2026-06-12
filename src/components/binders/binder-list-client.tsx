'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { BinderSummary } from '@/types/binder'
import { BinderCoverCard } from './binder-cover-card'
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">我的卡冊</h1>
        <Button onClick={() => setCreateOpen(true)} data-testid="create-binder-btn">
          新增卡冊
        </Button>
      </div>

      {binderList.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 gap-4"
          data-testid="empty-binder-state"
        >
          <p className="text-muted-foreground">還沒有卡冊，快來建立第一本吧！</p>
          <Button onClick={() => setCreateOpen(true)}>建立第一本卡冊</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {binderList.map(binder => (
            <BinderCoverCard
              key={binder.id}
              binder={binder}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          ))}
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
