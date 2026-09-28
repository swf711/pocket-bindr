import type { Game, Language } from '@prisma/client'
import { cardPublicPath, cardOgImagePath } from '@/lib/card-url'
import { CARD_JSONLD_LANG } from '@/lib/card-jsonld'
import { resolveCardDisplayImage } from '@/lib/resolve-card-image'
import { getCardImageUrl } from '@/lib/get-card-image-url'
import { hasCardNumber, formatCardSetLabel } from '@/lib/card-display'
import { isMultiNumberCard } from '@/lib/card-number'
import { SITE_URL, ogImageMetadata, toAbsoluteUrl } from '@/lib/og'
import type { Locale } from '@/i18n/locale'
import type { PublicCardRow, SameSetCardRow } from '@/lib/public-card-queries'
import type { CardBreadcrumbItem } from '@/lib/card-jsonld'
import { getTranslations } from './messages'

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** JSON-LD 內容注入 <script> 前必須跳脫 `<`，避免 `</script>` 提前結束 script 區塊（XSS）。 */
function escapeJsonLdForScript(json: string): string {
  return json.replace(/</g, '\\u003c')
}

export interface RenderCardPageInput {
  card: PublicCardRow
  sameSet: SameSetCardRow[]
  locale: Locale
  css: string
  breadcrumbItems: CardBreadcrumbItem[]
  jsonLd: Record<string, unknown>
}

function renderSameSetCard(card: SameSetCardRow): string {
  const image = resolveCardDisplayImage(card)
  const src = toAbsoluteUrl(getCardImageUrl(image.small) || image.small)
  const fit = isMultiNumberCard(card.cardNumber) ? 'contain' : 'cover'
  return `
    <a class="same-set-card" href="${escapeHtml(cardPublicPath(card))}">
      <img src="${escapeHtml(src)}" alt="${escapeHtml(card.name)}" loading="lazy" referrerpolicy="no-referrer" style="object-fit:${fit}" />
    </a>`
}

/**
 * 純 HTML、不 hydrate 的卡片落地頁。內容刻意精簡（M3 token 為底），非主站 React 版面的複製，
 * 以最小 CSS/JS 換取靜態產出簡單與 CDN 直出。
 */
export function renderCardPage(input: RenderCardPageInput): string {
  const { card, sameSet, locale, css, breadcrumbItems, jsonLd } = input
  const t = getTranslations(locale)
  const image = resolveCardDisplayImage(card)
  const imageSrc = toAbsoluteUrl(getCardImageUrl(image.large) || image.large)
  const title = `${card.name}（${formatCardSetLabel(card)}）· PocketBindr`
  const description = hasCardNumber(card.cardNumber)
    ? t('cardStandalone.metaDescription', {
        name: card.name,
        setName: card.set.name,
        cardNumber: card.cardNumber,
      })
    : t('cardStandalone.metaDescriptionNoNumber', { name: card.name, setName: card.set.name })

  const canonicalUrl = canonicalCardPageUrl(card)
  const ogImage = ogImageMetadata(cardOgImagePath(card))[0]
  const inLanguage = CARD_JSONLD_LANG[card.language]

  const breadcrumbHtml = breadcrumbItems
    .map((item, index) => {
      const isLast = index === breadcrumbItems.length - 1
      const label = escapeHtml(item.name)
      if (isLast || !item.href) return `<span aria-current="page">${label}</span>`
      return `<a href="${escapeHtml(toAbsoluteUrl(item.href))}">${label}</a>`
    })
    .join('<span class="sep">/</span>')

  const attrRows: string[] = []
  if (hasCardNumber(card.cardNumber)) {
    attrRows.push(attrRow(t('cardDetail.cardNumber'), escapeHtml(card.cardNumber)))
  }
  if (card.set.releaseDate) {
    attrRows.push(
      attrRow(t('cardDetail.releaseDate'), new Date(card.set.releaseDate).toISOString().slice(0, 10)),
    )
  }
  if (card.rarity) attrRows.push(attrRow(t('cardDetail.rarity'), `<span class="badge">${escapeHtml(card.rarity)}</span>`))
  if (card.hp != null) attrRows.push(attrRow('HP', `<span class="badge">${card.hp}</span>`))
  if (card.types.length > 0) {
    attrRows.push(
      attrRow(
        t('cardDetail.types'),
        card.types.map(type => `<span class="badge">${escapeHtml(type)}</span>`).join(' '),
      ),
    )
  }

  const seriesHref = `${SITE_URL}/cards?game=${card.game}&language=${card.language}&setId=${card.set.id}`
  const openInAppHref = `${SITE_URL}/cards?game=${card.game}&language=${card.language}&open=${encodeURIComponent(card.externalId)}`

  const sameSetHtml =
    sameSet.length > 0
      ? `
    <section class="same-set">
      <div class="same-set-header">
        <h2>${escapeHtml(t('cardStandalone.sameSetTitle'))}</h2>
        <a class="button-outline" href="${escapeHtml(seriesHref)}">${escapeHtml(t('cardStandalone.viewAllInSet'))}</a>
      </div>
      <div class="same-set-grid">${sameSet.map(renderSameSetCard).join('')}</div>
    </section>`
      : ''

  const brandHtml = `
  <a class="brand" href="${escapeHtml(SITE_URL)}">
    <img class="brand-logo brand-logo-light" src="/_assets/logo-light-sm.svg" alt="PocketBindr" />
    <img class="brand-logo brand-logo-dark" src="/_assets/logo-dark-sm.svg" alt="PocketBindr" />
  </a>`

  return `<!doctype html>
<html lang="${inLanguage}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="PocketBindr" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(toAbsoluteUrl(ogImage.url))}" />
<meta property="og:locale" content="${inLanguage.replace('-', '_')}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(toAbsoluteUrl(ogImage.url))}" />
<script type="application/ld+json">${escapeJsonLdForScript(JSON.stringify(jsonLd))}</script>
<style>${css}
${STATIC_CSS}</style>
</head>
<body>
<main class="page">
  ${brandHtml}
  <nav class="breadcrumb" aria-label="breadcrumb">${breadcrumbHtml}</nav>
  <div class="card-block">
    <div class="card-image">
      ${imageSrc ? `<img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(card.name)}" referrerpolicy="no-referrer" />` : `<div class="card-image-fallback">${escapeHtml(card.name)}</div>`}
    </div>
    <div class="card-info">
      <h1>${escapeHtml(card.name)}</h1>
      <p class="series"><a href="${escapeHtml(seriesHref)}">${escapeHtml(card.set.name)} <span class="set-code">${escapeHtml(card.set.externalId)}</span></a></p>
      <dl class="attrs">${attrRows.join('')}</dl>
      <a class="button-primary" href="${escapeHtml(openInAppHref)}">${escapeHtml(t('cardStandalone.openInApp'))}</a>
    </div>
  </div>
  ${sameSetHtml}
</main>
</body>
</html>`
}

function attrRow(label: string, valueHtml: string): string {
  return `<div class="attr"><dt>${escapeHtml(label)}</dt><dd>${valueHtml}</dd></div>`
}

/** canonical 為自身子網域絕對網址（產生器只在總開關已設時執行，見 generate.ts 的啟動檢查）。 */
function canonicalCardPageUrl(card: { game: Game; language: Language; externalId: string }): string {
  const origin = process.env.NEXT_PUBLIC_CARD_PAGES_ORIGIN
  if (!origin) {
    throw new Error('renderCardPage: NEXT_PUBLIC_CARD_PAGES_ORIGIN 必須在產生器 process 啟動前設定')
  }
  return `${origin}${cardPublicPath(card)}`
}

/** 精簡版佈局樣式，沿用 M3 token（css 參數）作為色彩基底。 */
const STATIC_CSS = `
* { box-sizing: border-box; }
body { margin: 0; background: var(--background); color: var(--foreground); font-family: system-ui, -apple-system, "PingFang TC", "Noto Sans JP", sans-serif; }
.page { max-width: 960px; margin: 0 auto; padding: 24px 16px 64px; display: flex; flex-direction: column; gap: 32px; }
.brand { display: inline-flex; align-self: flex-start; }
.brand-logo { width: 40px; height: 40px; }
.brand-logo-dark { display: none; }
@media (prefers-color-scheme: dark) { .brand-logo-light { display: none; } .brand-logo-dark { display: block; } }
.breadcrumb { font-size: 13px; color: var(--muted-foreground); display: flex; gap: 6px; flex-wrap: wrap; }
.breadcrumb a { color: inherit; text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.breadcrumb .sep { opacity: 0.6; }
.card-block { display: flex; flex-direction: column; gap: 24px; }
@media (min-width: 768px) { .card-block { flex-direction: row; align-items: flex-start; } }
.card-image { flex: 0 0 auto; width: 100%; max-width: 360px; margin: 0 auto; }
.card-image img { width: 100%; border-radius: var(--m3-radius-md, 12px); display: block; }
.card-image-fallback { aspect-ratio: 5/7; display: flex; align-items: center; justify-content: center; background: var(--muted); color: var(--muted-foreground); border-radius: var(--m3-radius-md, 12px); text-align: center; padding: 12px; }
.card-info { display: flex; flex-direction: column; gap: 16px; flex: 1; }
.card-info h1 { margin: 0; font-size: 24px; font-weight: 700; }
.series a { color: var(--primary); text-decoration: none; }
.series a:hover { text-decoration: underline; }
.set-code { font-size: 12px; color: var(--muted-foreground); }
.attrs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 16px; margin: 0; }
.attr dt { font-size: 12px; color: var(--muted-foreground); margin: 0; }
.attr dd { margin: 4px 0 0; }
.badge { display: inline-block; background: var(--tertiary-container); color: var(--on-tertiary-container); border-radius: 999px; padding: 2px 10px; font-size: 12px; }
.button-primary { display: inline-flex; align-self: flex-start; align-items: center; justify-content: center; background: var(--primary); color: var(--primary-foreground); border-radius: 999px; padding: 10px 20px; font-weight: 600; text-decoration: none; }
.button-outline { display: inline-flex; align-items: center; border: 1px solid var(--border); border-radius: 999px; padding: 6px 14px; text-decoration: none; color: inherit; font-size: 14px; }
.same-set { border-top: 1px solid var(--border); padding-top: 24px; display: flex; flex-direction: column; gap: 12px; }
.same-set-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.same-set-header h2 { margin: 0; font-size: 18px; font-weight: 600; }
.same-set-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
@media (min-width: 640px) { .same-set-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); } }
.same-set-card { display: block; aspect-ratio: 5/7; overflow: hidden; border-radius: var(--m3-radius-sm, 8px); box-shadow: 0 1px 2px rgba(0,0,0,0.15); }
.same-set-card img { width: 100%; height: 100%; }
`
