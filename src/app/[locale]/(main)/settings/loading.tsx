import { PageContainer } from '@/components/layout/page-container'
import { Skeleton } from '@/components/ui/skeleton'

function SettingsCardSkeleton() {
  return (
    <div className="rounded-xl border p-6 space-y-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export default function Loading() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid md:grid-cols-2 gap-4">
          <SettingsCardSkeleton />
          <SettingsCardSkeleton />
          <SettingsCardSkeleton />
          <SettingsCardSkeleton />
        </div>
      </div>
    </PageContainer>
  )
}
