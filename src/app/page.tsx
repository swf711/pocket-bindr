import { auth } from '@/lib/auth'
import { PageContainer } from '@/components/layout/page-container'
import { HeroSection } from '@/components/home/hero-section'
import { FeaturedCardsSection } from '@/components/home/featured-cards-section'
import { LatestSetsSection } from '@/components/home/latest-sets-section'
import { FeatureIntroSection } from '@/components/home/feature-intro-section'
import { getFeaturedCards, getLatestSets } from '@/lib/homepage-queries'

export default async function HomePage() {
  const session = await auth()
  const [featuredCards, latestSets] = await Promise.all([
    getFeaturedCards(),
    getLatestSets(),
  ])

  return (
    <PageContainer>
      <HeroSection isLoggedIn={!!session?.user} />
      <FeaturedCardsSection cards={featuredCards} />
      <LatestSetsSection sets={latestSets} />
      <FeatureIntroSection />
    </PageContainer>
  )
}
