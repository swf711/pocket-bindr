import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BinderPublicView } from '@/components/binder/binder-public-view'
import type { BinderPublicData } from '@/types/binder'

export default async function PublicBinderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const binder = await prisma.binder.findUnique({
    where: { shareToken: token },
    include: {
      user: { select: { username: true } },
      slots: {
        where: { cardId: { not: null } },
        orderBy: [{ pageNumber: 'asc' }, { slotIndex: 'asc' }],
        select: {
          id: true,
          binderId: true,
          cardId: true,
          pageNumber: true,
          slotIndex: true,
          status: true,
          card: {
            select: {
              id: true,
              name: true,
              imageSmall: true,
              language: true,
              cardNumber: true,
              rarity: true,
            },
          },
        },
      },
    },
  })

  if (!binder) notFound()

  const rawSettings = binder.settings as { totalPages?: number } | null
  const maxPageFromSlots = binder.slots.reduce((max, s) => Math.max(max, s.pageNumber), 0)
  const totalPages = Math.max(rawSettings?.totalPages ?? 0, maxPageFromSlots, 1)

  const data: BinderPublicData = {
    id: binder.id,
    name: binder.name,
    gridType: binder.gridType as BinderPublicData['gridType'],
    coverColor: binder.coverColor,
    description: binder.description ?? null,
    settings: { totalPages },
    slots: binder.slots.filter((s) => s.cardId !== null) as BinderPublicData['slots'],
    ownerName: binder.user.username ?? 'TCG 玩家',
  }

  return <BinderPublicView binder={data} />
}
