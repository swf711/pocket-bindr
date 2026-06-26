import { PageContainer } from '@/components/layout/page-container'
import { Skeleton } from '@/components/ui/skeleton'
import { cardGridClassName } from '@/components/cards/card-grid'

export default function Loading() {
  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-10 w-full mb-3" />
        <Skeleton className="h-10 w-64 mb-6" />
        <div className={cardGridClassName}>
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="aspect-2.5/3.5 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
