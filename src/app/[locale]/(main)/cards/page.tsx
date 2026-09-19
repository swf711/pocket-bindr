import { CardSearchClient } from '@/components/cards/card-search-client'
import { PageContainer } from '@/components/layout/page-container'

interface PageProps {
  searchParams: Promise<{
    game?: string
    q?: string
    setId?: string
    page?: string
    language?: string
  }>
}

export default async function CardsPage({ searchParams }: PageProps) {
  const params = await searchParams
  return <PageContainer><CardSearchClient initialParams={params} /></PageContainer>
}
