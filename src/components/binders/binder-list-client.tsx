'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BinderSummary, GRID_TYPE_LABELS } from '@/types/binder'
import { GridType } from '@prisma/client'
import { CreateBinderDialog } from './create-binder-dialog'
import { EditBinderDialog } from './edit-binder-dialog'
import { DeleteBinderDialog } from './delete-binder-dialog'

interface BinderListClientProps {
  initialBinders: BinderSummary[]
}

export function BinderListClient({ initialBinders }: BinderListClientProps) {
  const router = useRouter()
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
            <Card key={binder.id} data-testid="binder-card">
              <CardHeader>
                <CardTitle>{binder.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <Badge variant="secondary">
                  {GRID_TYPE_LABELS[binder.gridType as GridType]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {binder._count.slots} 張卡
                </span>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="default"
                  data-testid="enter-binder-btn"
                  onClick={() => router.push('/binders/' + binder.id)}
                >
                  進入卡冊
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  data-testid="edit-binder-btn"
                  onClick={() => openEdit(binder)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  data-testid="delete-binder-btn"
                  onClick={() => openDelete(binder)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
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
