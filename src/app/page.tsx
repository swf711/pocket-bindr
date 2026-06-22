import { auth } from '@/lib/auth'
import { PageContainer } from '@/components/layout/page-container'
import { HeroSection } from '@/components/home/hero-section'
import { HomePageClient } from '@/components/home/home-page-client'
import { FeatureIntroSection } from '@/components/home/feature-intro-section'
import { PromoCTASection } from '@/components/home/promo-cta-section'
import {
  getShowcaseCards,
  getLatestSetsByGame,
  getMostWantedCards,
} from '@/lib/homepage-queries'

export default async function HomePage() {
  const session = await auth()
  const [ptcgCards, ptcgSets, opcgCards, opcgSets, ptcgWanted, opcgWanted] = await Promise.all([
    getShowcaseCards('PTCG', 'ZH_TW'),
    getLatestSetsByGame('PTCG', 'ZH_TW'),
    getShowcaseCards('OPCG', 'JA'),
    getLatestSetsByGame('OPCG', 'JA'),
    getMostWantedCards('PTCG', 'ZH_TW', 10),
    getMostWantedCards('OPCG', 'JA', 10),
  ])

  const ptcgData = { showcaseCards: ptcgCards, latestSets: ptcgSets }
  const opcgData = { showcaseCards: opcgCards, latestSets: opcgSets }

  return (
    <PageContainer>
      <HeroSection isLoggedIn={!!session?.user} />
      <HomePageClient
        ptcgData={ptcgData}
        opcgData={opcgData}
        ptcgWanted={ptcgWanted}
        opcgWanted={opcgWanted}
      />
      <FeatureIntroSection />
      <PromoCTASection isLoggedIn={!!session?.user} />
    </PageContainer>
  )
}
