import type { Game, Language } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { expandPokemonNameTerms } from '@/lib/pokemon-name-dictionary'

export interface CrossLangExpansion {
  /** 子案 2（PTCG）：額外的 name-contains 比對詞（選定語言物種名） */
  nameTerms: string[]
  /** 子案 1（OPCG）：額外要併入結果的 card id（JA 檢視，來自 ZH_TW alias → canonical） */
  cardIds: string[]
}

type CardClient = { card: { findMany: typeof prisma.card.findMany } }

const EMPTY: CrossLangExpansion = { nameTerms: [], cardIds: [] }

/**
 * OPCG ZH_TW→JA 跨語言解析：JA 檢視輸入繁中角色名時，
 * 經 ZH_TW alias 卡名比對出對應的 canonical JA cardId 一併命中。
 * 54 張無 JA 對應的台灣限定卡（canonicalCardId=null）自然被排除。
 */
export async function resolveOpcgCrossLangCardIds(
  client: CardClient,
  lang: Language,
  q: string,
): Promise<string[]> {
  if (lang !== 'JA' || !q) return []

  const aliases = await client.card.findMany({
    where: {
      game: 'OPCG',
      language: 'ZH_TW',
      name: { contains: q, mode: 'insensitive' },
      canonicalCardId: { not: null },
    },
    select: { canonicalCardId: true },
  })

  const ids = new Set<string>()
  for (const alias of aliases) {
    if (alias.canonicalCardId) ids.add(alias.canonicalCardId)
  }
  return [...ids]
}

/**
 * 跨語言搜尋查詢詞展開統一入口；依 game 分派子案策略。
 * - PTCG：靜態物種字典展開比對詞（同步）
 * - OPCG：ZH_TW alias → canonical JA id 反查（非同步 DB 查詢）
 */
export async function buildCrossLangExpansion(
  client: CardClient,
  game: Game,
  lang: Language,
  q: string,
): Promise<CrossLangExpansion> {
  if (!q) return EMPTY

  if (game === 'PTCG') {
    return { nameTerms: expandPokemonNameTerms(q, lang), cardIds: [] }
  }

  if (game === 'OPCG') {
    return { nameTerms: [], cardIds: await resolveOpcgCrossLangCardIds(client, lang, q) }
  }

  return EMPTY
}
