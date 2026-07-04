import { BinderSpreadSkeleton } from '@/components/binder/binder-detail-skeleton'

export default function Loading() {
  return (
    <div data-testid="binder-public-skeleton">
      <BinderSpreadSkeleton
        showBackButton={false}
        showSettingsButton={false}
        showOwnerBanner
        showDesktopPagination
      />
    </div>
  )
}
