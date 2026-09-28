import { Game, Language } from '@prisma/client'
import type { Locale } from '@/i18n/locale'

/** card 語言（身份的一部分）→ URL path 段；與 cookie 版 UI locale 為兩套獨立系統。 */
export function langToPath(language: Language): string {
  switch (language) {
    case 'EN':
      return 'en'
    case 'JA':
      return 'ja'
    case 'ZH_TW':
      return 'zh-tw'
  }
}

export function pathToLang(segment: string): Language | null {
  switch (segment) {
    case 'en':
      return 'EN'
    case 'ja':
      return 'JA'
    case 'zh-tw':
      return 'ZH_TW'
    default:
      return null
  }
}

export function gameToPath(game: Game): string {
  return game === 'PTCG' ? 'ptcg' : 'opcg'
}

export function pathToGame(segment: string): Game | null {
  switch (segment) {
    case 'ptcg':
      return 'PTCG'
    case 'opcg':
      return 'OPCG'
    default:
      return null
  }
}

/** 卡片獨立 URL 路徑：/cards/{game}/{language}/{externalId}。 */
export function cardPath(card: { game: Game; language: Language; externalId: string }): string {
  return `/cards/${gameToPath(card.game)}/${langToPath(card.language)}/${encodeURIComponent(card.externalId)}`
}

/** Card OG image route (root-level handler, see HOME_OG_IMAGE_PATH in og.ts). */
export function cardOgImagePath(card: { game: Game; language: Language; externalId: string }): string {
  return `${cardPath(card)}/opengraph-image`
}

export function parseCardPathParams(
  gameParam: string,
  languageParam: string,
): { game: Game; language: Language } | null {
  const game = pathToGame(gameParam)
  const language = pathToLang(languageParam)
  if (!game || !language) return null
  return { game, language }
}

/** card Language → Open Graph locale。與 src/lib/og.ts 的 OG_LOCALE（UI locale 鍵）不同鍵域，故獨立命名。 */
export const CARD_OG_LOCALE: Record<Language, string> = {
  EN: 'en_US',
  JA: 'ja_JP',
  ZH_TW: 'zh_TW',
}

/** 卡片語言 → 落地頁 UI locale。與 cookie 版 UI locale 是兩套獨立系統，此為靜態卡片頁專用映射。 */
export const CARD_UI_LOCALE: Record<Language, Locale> = {
  EN: 'en',
  JA: 'ja',
  ZH_TW: 'zh-TW',
}

/**
 * 靜態卡片頁子網域的總開關。build 時讀取（inline 進 client bundle），未設時所有對外網址
 * 維持主站 cardPath，行為零變（休眠上線）。
 */
const CARD_PAGES_ORIGIN = process.env.NEXT_PUBLIC_CARD_PAGES_ORIGIN

/** 子網域上的路徑（不含 /cards 前綴）：/{game}/{language}/{externalId}。 */
export function cardPublicPath(card: { game: Game; language: Language; externalId: string }): string {
  return `/${gameToPath(card.game)}/${langToPath(card.language)}/${encodeURIComponent(card.externalId)}`
}

/**
 * 卡片對外公開網址（分享、canonical、JSON-LD、sitemap）。
 * 總開關未設時回主站 `cardPath`（相對路徑，呼叫端自行補 origin），行為與既有一致；
 * 已設時回子網域絕對網址，與呼叫端傳入的 origin 無關。
 */
export function cardPublicUrl(card: { game: Game; language: Language; externalId: string }): string {
  if (!CARD_PAGES_ORIGIN) return cardPath(card)
  return `${CARD_PAGES_ORIGIN}${cardPublicPath(card)}`
}
