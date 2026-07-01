import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { publicBinderTag } from '@/lib/binder-cache'
import { BinderPublicView } from '@/components/binder/binder-public-view'
import { slotDisplaySelect, toDisplaySlot } from '@/lib/slot-display'
import type { BinderPublicData } from '@/types/binder'

function fetchPublicBinder(token: string) {
  return unstable_cache(
    () =>
      prisma.binder.findUnique({
        where: { shareToken: token },
        include: {
          user: { select: { username: true } },
          slots: {
            where: { cardId: { not: null } },
            orderBy: [{ pageNumber: 'asc' }, { slotIndex: 'asc' }],
            select: slotDisplaySelect,
          },
        },
      }),
    ['binder-public', token],
    { revalidate: 300, tags: [publicBinderTag(token)] },
  )()
}

export default async function PublicBinderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const t = await getTranslations('binder')

  const binder = await fetchPublicBinder(token)

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
    slots: binder.slots.map(toDisplaySlot),
    ownerName: binder.user.username ?? t('defaultOwnerName'),
  }

  return <BinderPublicView binder={data} />
}
