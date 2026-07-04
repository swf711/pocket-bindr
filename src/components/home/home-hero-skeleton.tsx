import { Skeleton } from '@/components/ui/skeleton'

/**
 * 首頁極簡首屏骨架，只對齊 HeroSection above-the-fold 版面
 * （h-screen、container px-4 lg:px-16 pt-16、grid lg:grid-cols-2）。
 * 下方 sticky parallax / carousel 區塊不複製（結構複雜、載入時資料未知，效益低）。
 */
export function HomeHeroSkeleton() {
  return (
    <section className="h-screen flex items-start" data-testid="home-hero-skeleton">
      <div className="container mx-auto px-4 lg:px-16 pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-0">
          <div className="flex flex-col justify-center gap-4 items-center lg:items-start">
            <Skeleton className="h-16 w-64 mb-4" />
            <Skeleton className="h-5 w-48" />
            <div className="flex gap-3">
              <Skeleton className="h-14 w-32 rounded-3xl" />
              <Skeleton className="h-14 w-32 rounded-3xl" />
            </div>
            <Skeleton className="h-4 w-40" />
          </div>

          <div className="flex justify-center lg:justify-start">
            <div className="w-[85vw] lg:w-[40vw]">
              <Skeleton className="w-full aspect-5/7 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
