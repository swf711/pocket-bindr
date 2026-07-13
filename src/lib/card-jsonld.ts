import type { Language } from '@prisma/client'
import type { PublicCardRow } from '@/lib/public-card'
import { resolveCardDisplayImage } from '@/lib/resolve-card-image'
import { cardPath } from '@/lib/card-url'
import { SITE_URL, toAbsoluteUrl } from '@/lib/og'

/**
 * card Language → BCP-47（JSON-LD `inLanguage` 用）。與 CARD_OG_LOCALE（card-url.ts，OG 底線形
 * `en_US`）、OG_LOCALE（og.ts，UI locale 鍵域）皆為不同鍵域，故獨立命名避免混用。
 */
export const CARD_JSONLD_LANG: Record<Language, string> = {
  EN: 'en',
  JA: 'ja',
  ZH_TW: 'zh-TW',
}

const GAME_NAME: Record<PublicCardRow['game'], string> = {
  PTCG: 'Pokémon TCG',
  OPCG: 'One Piece TCG',
}

/** 麵包屑節點；JSON-LD 與可見 UI 共用單一真相。末節（自身）href 為 null。 */
export type CardBreadcrumbItem = { name: string; href: string | null }

/**
 * 四層麵包屑：首頁 › 卡牌 › 系列（帶 query 的列表頁，非獨立系列頁——系列頁尚未存在）› 卡名。
 * 系列節點刻意不指向 `/cards/{game}` 或 `/cards/{game}/{language}`——這兩個 URL 不存在，會 404。
 */
export function buildCardBreadcrumbItems(
  card: PublicCardRow,
  labels: { home: string; cards: string },
): CardBreadcrumbItem[] {
  const seriesHref = `/cards?game=${card.game}&language=${card.language}&setId=${card.set.id}`
  return [
    { name: labels.home, href: '/' },
    { name: labels.cards, href: '/cards' },
    { name: card.set.name, href: seriesHref },
    { name: card.name, href: null },
  ]
}

function formatDate(value: Date | string): string {
  return new Date(value).toISOString().slice(0, 10)
}

/**
 * 回傳 `@graph` 物件（呼叫端 `JSON.stringify` 後注入 `<script type="application/ld+json">`）。
 * 誠實原則：不用 Product（無 offers/price 時不觸發富摘要，只換來 GSC 缺少欄位警告與假販售語意），
 * 改用 BreadcrumbList + WebPage(mainEntity: CreativeWork)；唯一預期渲染的 rich result 是麵包屑。
 *
 * 條件輸出是硬需求：rarity（PTCG ZH_TW 全 null）、supertype（3,215 張為空字串非 null）、
 * hp、types、releaseDate 任一為空時該 property 整個省略，不輸出空值。
 */
export function buildCardJsonLd(
  card: PublicCardRow,
  breadcrumbItems: CardBreadcrumbItem[],
): Record<string, unknown> {
  const selfUrl = toAbsoluteUrl(cardPath(card))
  const inLanguage = CARD_JSONLD_LANG[card.language]
  const image = resolveCardDisplayImage(card)
  const absoluteImage = image.large ? toAbsoluteUrl(image.large) : null

  const breadcrumbList = {
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: toAbsoluteUrl(item.href) } : {}),
    })),
  }

  const additionalProperty: Array<{ '@type': 'PropertyValue'; name: string; value: unknown }> = []
  additionalProperty.push({ '@type': 'PropertyValue', name: 'cardNumber', value: card.cardNumber })
  if (card.rarity) additionalProperty.push({ '@type': 'PropertyValue', name: 'rarity', value: card.rarity })
  if (card.supertype) additionalProperty.push({ '@type': 'PropertyValue', name: 'supertype', value: card.supertype })
  if (card.hp != null) additionalProperty.push({ '@type': 'PropertyValue', name: 'hp', value: card.hp })
  if (card.types.length > 0) additionalProperty.push({ '@type': 'PropertyValue', name: 'types', value: card.types })

  const mainEntity: Record<string, unknown> = {
    '@type': 'CreativeWork',
    '@id': `${selfUrl}#card`,
    name: card.name,
    url: selfUrl,
    inLanguage,
    isPartOf: {
      '@type': 'CreativeWorkSeries',
      name: card.set.name,
      identifier: card.set.externalId,
    },
    genre: GAME_NAME[card.game],
  }
  if (absoluteImage) mainEntity.image = absoluteImage
  if (card.set.releaseDate) mainEntity.datePublished = formatDate(card.set.releaseDate)
  if (additionalProperty.length > 0) mainEntity.additionalProperty = additionalProperty

  const webPage: Record<string, unknown> = {
    '@type': 'WebPage',
    '@id': `${selfUrl}#webpage`,
    url: selfUrl,
    name: card.name,
    inLanguage,
    isPartOf: { '@type': 'WebSite', name: 'PocketBindr', url: SITE_URL },
    mainEntity,
  }
  if (absoluteImage) {
    webPage.primaryImageOfPage = { '@id': `${selfUrl}#image` }
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [breadcrumbList, webPage],
  }
}
