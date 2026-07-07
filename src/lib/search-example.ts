import type { Game, Language } from '@prisma/client'

/**
 * (game, 卡牌語言) → 精準搜尋範例查詢字串 + 該卡名稱，供搜尋框 placeholder 動態範例共用的單一真相。
 * 每個查詢字串已對照真實 DB 資料驗證：套進 parseSetCardQuery + buildSetCardPrismaWhere 恰命中對應名稱的卡。
 * PTCG 三語言卡面碼有落差（ZH_TW 剝尾 F、EN 用 ptcgoCode、JA = externalId），故各語言各自一個範例
 * （皮卡丘ex 系列，各語言取各自最新一次印刷，非同一張實體卡）；
 * OPCG 無此落差，三語同碼（OP16-015「魯夫」，與 `?` 圖例的示範卡同一張，三語僅卡名顯示不同）。
 */
interface SearchExample {
  query: string
  name: string
}

const SEARCH_EXAMPLES: Record<Game, Partial<Record<Language, SearchExample>>> = {
  PTCG: {
    ZH_TW: { query: 'MJF 008/022', name: '皮卡丘ex' },
    EN: { query: 'me2pt5 55', name: 'Pikachu' },
    JA: { query: 'MP1 006/023', name: 'ピカチュウex' },
  },
  OPCG: {
    ZH_TW: { query: 'OP16-015', name: '魯夫' },
    EN: { query: 'OP16-015', name: 'Luffy' },
    JA: { query: 'OP16-015', name: 'ルフィ' },
  },
}

function resolveExample(game: Game, language: Language): SearchExample {
  return SEARCH_EXAMPLES[game][language] ?? SEARCH_EXAMPLES[game].EN!
}

export function getSearchExample(game: Game, language: Language): string {
  return resolveExample(game, language).query
}

export function getSearchExampleName(game: Game, language: Language): string {
  return resolveExample(game, language).name
}
