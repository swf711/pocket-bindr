import { Skeleton } from '@/components/ui/skeleton'
import { cardGridClassName } from '@/components/cards/card-grid'

/**
 * 卡冊列表載入骨架，對齊 BinderListClient 版面
 * （寬度/邊距由 PageContainer 提供 → 標題列 → 封面卡牌 grid，封面為 aspect-2.5/3.5）。
 */
export function BinderListSkeleton() {
  return (
    <div data-testid="binder-list-skeleton" className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-2 w-24" />
        </div>
      </div>

      <div className={cardGridClassName}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-2.5/3.5 w-full rounded-r-lg" />
        ))}
      </div>
    </div>
  )
}
