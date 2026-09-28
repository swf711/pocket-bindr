import { CardSearchClient } from '@/components/cards/card-search-client'
import { PageContainer } from '@/components/layout/page-container'

interface PageProps {
  searchParams: Promise<{
    game?: string
    q?: string
    setId?: string
    page?: string
    language?: string
    open?: string
  }>
}

export default async function CardsPage({ searchParams }: PageProps) {
  const { open, q, ...rest } = await searchParams
  // 靜態卡片頁「在 PocketBindr 開啟」入口：/cards?game=&language=&open=<externalId>。
  // 伺服器端把 open 對應成 q，讓第一次查詢就帶 q，client 端載入後再判斷是否 push 進該卡。
  const initialParams = { ...rest, q: open ?? q }
  return (
    <PageContainer>
      <CardSearchClient initialParams={initialParams} initialOpen={open} />
    </PageContainer>
  )
}
