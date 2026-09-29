import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { toParamLocale } from '@/i18n/locale'
import { HeroSection } from '@/components/home/hero-section'
import { StatsCarouselSection } from '@/components/home/stats-carousel-section'
import { FeaturePlatformSection } from '@/components/home/feature-platform-section'
import { WhySection } from '@/components/home/why-section'
import { HomeSnapScroll } from '@/components/home/home-snap-scroll'
import { HomeHeroSkeleton } from '@/components/home/home-hero-skeleton'
import {
  getTotalCardCount,
  getShowcaseCards,
  getLatestSeriesCards,
} from '@/lib/homepage-queries'

// On-demand ISR: this page previously called auth() just to decide whether to render
// the "My Binders" hero CTA, which made every request dynamic (see HeroMyBindersButton
// for the client-side replacement). Nothing else here reads request-scoped data.
export const revalidate = 3600

async function HomeContent() {
  const [
    totalCards,
    [ptcgHeroCards, opcgHeroCards],
    ptcgZhTw,
    ptcgJa,
    ptcgEn,
    opcgJa,
    opcgEn,
  ] = await Promise.all([
    getTotalCardCount(),
    Promise.all([
      getShowcaseCards('PTCG', 'ZH_TW', 5),
      getShowcaseCards('OPCG', 'JA', 4),
    ]),
    getLatestSeriesCards('PTCG', 'ZH_TW', 2),
    getLatestSeriesCards('PTCG', 'JA', 2),
    getLatestSeriesCards('PTCG', 'EN', 2),
    getLatestSeriesCards('OPCG', 'JA', 4),
    getLatestSeriesCards('OPCG', 'EN', 2),
  ])

  const carouselCards = [...ptcgZhTw, ...ptcgJa, ...ptcgEn, ...opcgJa, ...opcgEn]

  // Interleave PTCG and OPCG cards for visual variety in the hero binder
  const heroCards = ptcgHeroCards.flatMap((card, i) =>
    opcgHeroCards[i] ? [card, opcgHeroCards[i]] : [card]
  )

  return (
    <>
      <HeroSection cards={heroCards} />
      <StatsCarouselSection totalCards={totalCards} carouselCards={carouselCards} />
      <FeaturePlatformSection />
      <WhySection />
    </>
  )
}

type PageProps = { params: Promise<{ locale: string }> }

export default async function HomePage({ params }: PageProps) {
  setRequestLocale(toParamLocale((await params).locale))
  return (
    // 實際捲動容器是 window（<html>）；snap 由 HomeSnapScroll 掛在 documentElement，
    // 此處不再用 overflow-y-auto（否則它會成為 sticky 的捲動祖先而使 sticky 失效）。
    <div className="flex-1">
      <HomeSnapScroll />
      <Suspense fallback={<HomeHeroSkeleton />}>
        <HomeContent />
      </Suspense>
    </div>
  )
}
