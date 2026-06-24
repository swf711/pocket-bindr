import { PageContainer } from '@/components/layout/page-container'
import { BinderListSkeleton } from '@/components/binders/binder-list-skeleton'

export default function Loading() {
  return (
    <PageContainer>
      <BinderListSkeleton />
    </PageContainer>
  )
}
