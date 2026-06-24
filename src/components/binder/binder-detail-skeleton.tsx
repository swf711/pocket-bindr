import { Skeleton } from '@/components/ui/skeleton'

/**
 * 卡冊詳情載入骨架，對齊 BinderView 的鎖高佈局
 * （shrink-0 header 56px + 中央 spread 面板）。格位以 3x3 佔位示意。
 */
export function BinderDetailSkeleton() {
  return (
    <div data-testid="binder-detail-skeleton" className="flex h-full flex-col">
      {/* header（返回 / 名稱 / 翻頁 / 設定） */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-6 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>

      {/* 中央 spread 面板 */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="grid w-full max-w-3xl grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-2.5/3.5 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
