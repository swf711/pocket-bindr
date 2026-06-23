import { auth } from '@/lib/auth'
import { PageContainer } from '@/components/layout/page-container'
import { prisma } from '@/lib/prisma'
import { BinderListClient } from '@/components/binders/binder-list-client'
import { redirect } from 'next/navigation'
import { BinderSummary } from '@/types/binder'

export default async function BindersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const binders = await prisma.binder.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { slots: true } } },
    orderBy: { sortOrder: 'asc' },
  })

  const binderSummaries: BinderSummary[] = binders.map(b => ({
    ...b,
    settings: b.settings as Record<string, unknown> | null,
    createdAt: b.createdAt.toISOString(),
    coverColor: b.coverColor,
    shareToken: b.shareToken ?? null,
  }))

  return <PageContainer><BinderListClient initialBinders={binderSummaries} /></PageContainer>
}
