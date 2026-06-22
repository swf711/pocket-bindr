import { auth } from '@/lib/auth'
import { HeroSection } from '@/components/home/hero-section'
import { StatsCarouselSection } from '@/components/home/stats-carousel-section'
import { HomePageClient } from '@/components/home/home-page-client'
import { WhySection } from '@/components/home/why-section'
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
    heroCards,
    ptcgZhTw,
    ptcgJa,
    ptcgEn,
    opcgJa,
    opcgEn,
    ptcgWanted,
    opcgWanted,
  ] = await Promise.all([
    getTotalCardCount(),
    getShowcaseCards('PTCG', 'ZH_TW', 9),
    getLatestSeriesCards('PTCG', 'ZH_TW', 2),
    getLatestSeriesCards('PTCG', 'JA', 2),
    getLatestSeriesCards('PTCG', 'EN', 2),
    getLatestSeriesCards('OPCG', 'JA', 4),
    getLatestSeriesCards('OPCG', 'EN', 2),
    getMostWantedCards('PTCG', 'ZH_TW', 3),
    getMostWantedCards('OPCG', 'JA', 3),
  ])

  const carouselCards = [...ptcgZhTw, ...ptcgJa, ...ptcgEn, ...opcgJa, ...opcgEn]

  return (
    <div className="flex-1 overflow-y-auto scroll-smooth snap-y snap-mandatory">
      <HeroSection isLoggedIn={!!session?.user} cards={heroCards} />
      <StatsCarouselSection totalCards={totalCards} carouselCards={carouselCards} />
      <HomePageClient ptcgWanted={ptcgWanted} opcgWanted={opcgWanted} />
      <WhySection isLoggedIn={!!session?.user} />
    </div>
  )
}
