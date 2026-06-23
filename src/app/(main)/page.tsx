import { auth } from '@/lib/auth'
import { HeroSection } from '@/components/home/hero-section'
import { StatsCarouselSection } from '@/components/home/stats-carousel-section'
import { HomePageClient } from '@/components/home/home-page-client'
import { WhySection } from '@/components/home/why-section'
import { HomeSnapScroll } from '@/components/home/home-snap-scroll'
import {
  getTotalCardCount,
  getShowcaseCards,
  getLatestSeriesCards,
  getMostWantedCards,
} from '@/lib/homepage-queries'

export default async function HomePage() {
  const session = await auth()
  const [
    totalCards,
    [ptcgHeroCards, opcgHeroCards],
    ptcgZhTw,
    ptcgJa,
    ptcgEn,
    opcgJa,
    opcgEn,
    ptcgWanted,
    opcgWanted,
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
    getMostWantedCards('PTCG', 'ZH_TW', 3),
    getMostWantedCards('OPCG', 'JA', 3),
  ])

  const carouselCards = [...ptcgZhTw, ...ptcgJa, ...ptcgEn, ...opcgJa, ...opcgEn]

  // Interleave PTCG and OPCG cards for visual variety in the hero binder
  const heroCards = ptcgHeroCards.flatMap((card, i) =>
    opcgHeroCards[i] ? [card, opcgHeroCards[i]] : [card]
  )

  return (
    // 實際捲動容器是 window（<html>）；snap 由 HomeSnapScroll 掛在 documentElement，
    // 此處不再用 overflow-y-auto（否則它會成為 sticky 的捲動祖先而使 sticky 失效）。
    <div className="flex-1">
      <HomeSnapScroll />
      <HeroSection isLoggedIn={!!session?.user} cards={heroCards} />
      <StatsCarouselSection totalCards={totalCards} carouselCards={carouselCards} />
      <HomePageClient ptcgWanted={ptcgWanted} opcgWanted={opcgWanted} />
      <WhySection isLoggedIn={!!session?.user} />
    </div>
  )
}
