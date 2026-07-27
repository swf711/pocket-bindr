import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { parseCardPathParams, cardPath, CARD_OG_LOCALE } from '@/lib/card-url'
import { getPublicCardByTriple, getSameSetCards } from '@/lib/public-card'
import { formatCardSetLabel, hasCardNumber } from '@/lib/card-display'
import { buildCardBreadcrumbItems, buildCardJsonLd } from '@/lib/card-jsonld'
import { CardStandaloneView } from '@/components/cards/card-standalone-view'
import { PageContainer } from '@/components/layout/page-container'

type PageParams = { game: string; language: string; externalId: string }

async function loadCard(params: Promise<PageParams>) {
  const { game, language, externalId } = await params
  const parsed = parseCardPathParams(game, language)
  if (!parsed) return null
  return getPublicCardByTriple(parsed.game, parsed.language, decodeURIComponent(externalId))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>
}): Promise<Metadata> {
  const card = await loadCard(params)
  if (!card) return {}

  const t = await getTranslations('cardStandalone')
  const title = `${card.name}（${formatCardSetLabel(card)}）· PocketBindr`
  // PTCG JA DP 世代部分卡無收集號，改用不含 {cardNumber} 的文案，避免留下空欄位／多餘分隔。
  const description = hasCardNumber(card.cardNumber)
    ? t('metaDescription', {
        name: card.name,
        setName: card.set.name,
        cardNumber: card.cardNumber,
      })
    : t('metaDescriptionNoNumber', { name: card.name, setName: card.set.name })
  const path = cardPath(card)

  return {
    title,
    description,
    // self-canonical：DB canonicalCardId 為資料層（收藏/圖片來源），不驅動 SEO canonical。
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: 'PocketBindr',
      title,
      description,
      url: path,
      locale: CARD_OG_LOCALE[card.language],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function CardStandalonePage({ params }: { params: Promise<PageParams> }) {
  const card = await loadCard(params)
  if (!card) notFound()

  const sameSetCards = await getSameSetCards(card.setId, card.id, 6)
  const tNav = await getTranslations('nav')
  const breadcrumbItems = buildCardBreadcrumbItems(card, { home: tNav('home'), cards: tNav('cards') })
  const jsonLd = buildCardJsonLd(card, breadcrumbItems)

  return (
    <PageContainer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CardStandaloneView card={card} sameSetCards={sameSetCards} breadcrumbItems={breadcrumbItems} />
    </PageContainer>
  )
}
