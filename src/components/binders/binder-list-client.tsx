'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { BinderSummary } from '@/types/binder'
import { cardGridClassName } from '@/components/cards/card-grid'
import { MAX_BINDERS_PER_USER } from '@/lib/binder-limits'
import { SortableBinderCoverCard } from './sortable-binder-cover-card'
import { AddBinderSlot } from './add-binder-slot'
import { CreateBinderDialog } from './create-binder-dialog'
import { EditBinderDialog } from './edit-binder-dialog'
import { DeleteBinderDialog } from './delete-binder-dialog'
import { ShareBinderDialog } from '@/components/binder/share-binder-dialog'

interface BinderListClientProps {
  initialBinders: BinderSummary[]
}

export function BinderListClient({ initialBinders }: BinderListClientProps) {
  const t = useTranslations('binderList')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [binderList, setBinderList] = useState<BinderSummary[]>(initialBinders)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [selectedBinder, setSelectedBinder] = useState<BinderSummary | null>(null)
  const [tappedBinderId, setTappedBinderId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleCreated(binder: BinderSummary) {
    setBinderList(prev => [...prev, binder])
    toast(t('created'))
  }

  function handleUpdated(binder: BinderSummary) {
    setBinderList(prev => prev.map(b => (b.id === binder.id ? binder : b)))
    toast(t('updated'))
  }

  function handleDeleted(id: string) {
    setBinderList(prev => prev.filter(b => b.id !== id))
    toast(t('deleted'))
  }

  function openEdit(binder: BinderSummary) {
    setSelectedBinder(binder)
    setEditOpen(true)
  }

  function openDelete(binder: BinderSummary) {
    setSelectedBinder(binder)
    setDeleteOpen(true)
  }

  function openShare(binder: BinderSummary) {
    setSelectedBinder(binder)
    setShareOpen(true)
  }

  function handleShareTokenChange(token: string | null) {
    if (!selectedBinder) return
    setBinderList(prev =>
      prev.map(b => b.id === selectedBinder.id ? { ...b, shareToken: token } : b)
    )
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = binderList.findIndex(b => b.id === active.id)
    const newIndex = binderList.findIndex(b => b.id === over.id)
    const newList = arrayMove(binderList, oldIndex, newIndex)

    setBinderList(newList)

    try {
      const res = await fetch('/api/binders/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: newList.map(b => b.id) }),
      })
      if (!res.ok) throw new Error('reorder failed')
    } catch {
      setBinderList(binderList)
      toast.error(t('reorderFailed'))
    }
  }

  const canAddMore = binderList.length < MAX_BINDERS_PER_USER

  useEffect(() => {
    if (searchParams.get('new') === '1' && canAddMore) {
      setCreateOpen(true)
      router.replace('/binders')
    }
  }, [searchParams, canAddMore, router])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="flex items-center gap-3">
          <div className="whitespace-nowrap" data-testid="binder-count-stat">
            <span className="text-xl mr-1">{binderList.length}</span>
            <span className="text-sm text-muted-foreground">/ {MAX_BINDERS_PER_USER} {t('countUnit')}</span>
          </div>
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
            <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('emptyDescription')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="lg" onClick={() => setCreateOpen(true)}>{t('createFirst')}</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div onClick={() => setTappedBinderId(null)}>
          <DndContext
            id="binder-list-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className={cardGridClassName}>
              <SortableContext items={binderList.map(b => b.id)} strategy={rectSortingStrategy}>
                {binderList.map(binder => (
                  <SortableBinderCoverCard
                    key={binder.id}
                    binder={binder}
                    onEdit={openEdit}
                    onDelete={openDelete}
                    onShare={openShare}
                    isTapped={tappedBinderId === binder.id}
                    onTap={() => setTappedBinderId(prev => prev === binder.id ? null : binder.id)}
                  />
                ))}
              </SortableContext>
              {canAddMore && <AddBinderSlot onClick={() => setCreateOpen(true)} />}
            </div>
          </DndContext>
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

      {selectedBinder && (
        <ShareBinderDialog
          binderId={selectedBinder.id}
          initialToken={selectedBinder.shareToken}
          open={shareOpen}
          onOpenChange={setShareOpen}
          onTokenChange={handleShareTokenChange}
        />
      )}
    </div>
  )
}
