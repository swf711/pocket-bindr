import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BinderView } from '@/components/binder/binder-view'
import { slotDisplaySelect, toDisplaySlot } from '@/lib/slot-display'
import type { BinderDetailResponse, BinderSettings } from '@/types/binder'

export default async function BinderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const binder = await prisma.binder.findUnique({
    where: { id },
    include: {
      slots: {
        where: { cardId: { not: null } },
        orderBy: [{ pageNumber: 'asc' }, { slotIndex: 'asc' }],
        select: slotDisplaySelect,
      },
    },
  })

  if (!binder || binder.userId !== session.user.id) redirect('/binders')

  const slots = binder.slots.map(toDisplaySlot)
  const rawSettings = binder.settings as BinderSettings | null
  const maxPageFromSlots = slots.reduce((max, s) => Math.max(max, s.pageNumber), 0)
  const totalPages = Math.max(rawSettings?.totalPages ?? 0, maxPageFromSlots, 1)
  const settings: BinderSettings = { totalPages }

  const binderData: BinderDetailResponse = {
    id: binder.id,
    name: binder.name,
    gridType: binder.gridType as BinderDetailResponse['gridType'],
    coverColor: binder.coverColor,
    description: binder.description ?? null,
    settings,
    slots,
    shareToken: binder.shareToken ?? null,
  }

  return <BinderView binder={binderData} />
}
