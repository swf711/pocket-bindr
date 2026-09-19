import { CollectionClient } from '@/components/collection/collection-client'
import { PageContainer } from '@/components/layout/page-container'

interface PageProps {
  searchParams: Promise<{
    status?: string
    game?: string
    language?: string
    setId?: string
    q?: string
    page?: string
  }>
}

export default async function CollectionPage({ searchParams }: PageProps) {
  const params = await searchParams
  return (
    <PageContainer>
      <CollectionClient initialParams={params} />
    </PageContainer>
  )
}
