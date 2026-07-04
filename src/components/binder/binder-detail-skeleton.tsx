import { Skeleton } from '@/components/ui/skeleton'

interface BinderSpreadSkeletonProps {
  /** 是否顯示返回按鈕（詳情頁有、公開分享頁無） */
  showBackButton?: boolean
  /** 是否顯示右側設定按鈕（詳情頁有、公開分享頁無） */
  showSettingsButton?: boolean
  /** 是否在名稱上方顯示 owner banner 佔位（僅公開分享頁） */
  showOwnerBanner?: boolean
  /** 桌面 header 是否顯示 pagination cluster（詳情頁、公開頁桌面皆有） */
  showDesktopPagination?: boolean
}

/**
 * 卡冊 spread 版面共用骨架，對齊 BinderView / BinderPublicView 的鎖高佈局
 * （h-[calc(100vh-57px)] p-4，無 border-b）：桌面雙面板 spread（hidden md:flex）、
 * 行動裝置單面板 + 底部翻頁列（md:hidden）。格位比例 aspect-5/7、gap-1，對齊 BinderGridSlots。
 */
export function BinderSpreadSkeleton({
  showBackButton = true,
  showSettingsButton = true,
  showOwnerBanner = false,
  showDesktopPagination = true,
}: BinderSpreadSkeletonProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0 h-[calc(100vh-57px)] p-4">
      {/* ── 桌面 Spread 雙頁展開 ── */}
      <div className="hidden md:flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between" style={{ height: 56 }}>
          <div className="flex items-center gap-3">
            {showBackButton && <Skeleton className="h-9 w-9 rounded-md" />}
            <div>
              {showOwnerBanner && <Skeleton className="h-3 w-24 mb-1" />}
              <Skeleton className="h-6 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showDesktopPagination && (
              <>
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </>
            )}
            {showSettingsButton && <Skeleton className="h-9 w-9 rounded-md" />}
          </div>
        </div>

        <div className="flex flex-1 gap-4 min-h-0">
          {[0, 1].map((panel) => (
            <div key={panel} className="flex-1 rounded-lg border-4 border-muted overflow-hidden p-4">
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-5/7 w-full rounded-md" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 行動裝置單頁 ── */}
      <div className="md:hidden flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between" style={{ height: 56 }}>
          <div className="flex items-center gap-3">
            {showBackButton && <Skeleton className="h-6 w-6 rounded-md" />}
            <div>
              {showOwnerBanner && <Skeleton className="h-3 w-20 mb-1" />}
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
          {showSettingsButton && <Skeleton className="h-9 w-9 rounded-md" />}
        </div>

        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="w-full h-full max-w-sm rounded-lg border-4 border-muted overflow-hidden p-4">
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="aspect-5/7 w-full rounded-md" />
              ))}
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-center gap-2 py-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-5 w-10" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>
    </div>
  )
}

/**
 * 卡冊詳情頁載入骨架（/binders/[id]）：返回鈕 + 設定鈕 + 桌面 pagination，無 owner banner。
 */
export function BinderDetailSkeleton() {
  return (
    <div data-testid="binder-detail-skeleton">
      <BinderSpreadSkeleton showBackButton showSettingsButton showDesktopPagination />
    </div>
  )
}
