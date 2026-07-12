import { Game, Language } from '@prisma/client'

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
