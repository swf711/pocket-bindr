import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/lib/auth'
import { BinderPublicView } from '@/components/binder/binder-public-view'
import { toDisplaySlot } from '@/lib/slot-display'
import { fetchPublicBinder } from '@/lib/public-binder'
import type { BinderPublicData } from '@/types/binder'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const binder = await fetchPublicBinder(token)
  if (!binder) return {}

  const t = await getTranslations('metadata')
  const owner = binder.user.username ?? (await getTranslations('binder'))('defaultOwnerName')
  const title = `${binder.name} · PocketBindr`
  const description = binder.description ?? t('ogBinderDescription', { owner })

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      siteName: 'PocketBindr',
      title,
      description,
      url: `/b/${token}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function PublicBinderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const t = await getTranslations('binder')

  const [binder, session] = await Promise.all([fetchPublicBinder(token), auth()])

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

  return <BinderPublicView binder={data} isAuthenticated={!!session?.user} />
}
