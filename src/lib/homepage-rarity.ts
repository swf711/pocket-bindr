import type { Game } from '@prisma/client'
import type { ShowcaseCard } from '@/types/homepage'

// 由低到高排序；未列出的字串視為最低（rank -1）。新資料來源出現新稀有度字串時於此補齊。
const RARITY_TIERS: Record<Game, string[]> = {
  PTCG: [
    // EN（pokemontcg.io 長名）
    'common',
    'promo',
    'uncommon',
    'rare',
    'rare holo',
    'classic collection',
    'rare holo star',
    'rare prime',
    'legend',
    'rare shining',
    'rare prism star',
    'rare break',
    'rare ace',
    'ace spec rare',
    'rare holo lv.x',
    'rare holo ex',
    'rare holo gx',
    'rare shiny gx',
    'amazing rare',
    'rare holo v',
    'trainer gallery rare holo',
    'radiant rare',
    'rare holo vmax',
    'shiny rare',
    'rare shiny',
    'rare holo vstar',
    'double rare',
    'ultra rare',
    'rare ultra',
    'black white rare',
    'illustration rare',
    'rare rainbow',
    'rare secret',
    'shiny ultra rare',
    'hyper rare',
    'mega hyper rare',
    'mega_attack_rare',
    'special illustration rare',
    // JA（icon 代碼）
    'c',
    'c_c',
    'c2',
    'u',
    'u_c',
    'u2',
    'r',
    'r_c',
    'ar',
    'rr',
    's',
    's_2',
    'ss',
    'tr',
    'sr_c',
    'chr',
    'sar',
    'csr',
    'hr',
    'ur_c',
    'ssr',
    'bwr',
    'ma',
    'mur',
  ],
  OPCG: [
    'c',
    'uc',
    'l',
    'p',
    'r',
    'sr',
    'sp',
    'spカード',
    'sp card',
    'sp p',
    'sp卡',
    'tr',
    'sec',
  ],
}

export function rarityRank(game: Game, rarity: string | null | undefined): number {
  const normalized = rarity?.trim().toLowerCase()
  if (!normalized) return -1
  return RARITY_TIERS[game].indexOf(normalized)
}

const HIGH_RARITY_CUTOFF: Record<Game, number> = {
  PTCG: RARITY_TIERS.PTCG.indexOf('double rare'),
  OPCG: RARITY_TIERS.OPCG.indexOf('sr'),
}

export const HIGH_RARITIES: Record<Game, string[]> = {
  PTCG: RARITY_TIERS.PTCG.slice(HIGH_RARITY_CUTOFF.PTCG),
  OPCG: RARITY_TIERS.OPCG.slice(HIGH_RARITY_CUTOFF.OPCG),
}

export function cardNumberNumerator(cardNumber: string): number {
  const match = cardNumber.match(/^0*(\d+)/)
  return match ? parseInt(match[1], 10) : -1
}

export function compareShowcaseCards(
  game: Game
): (a: ShowcaseCard, b: ShowcaseCard) => number {
  return (a, b) => {
    const rarityDiff = rarityRank(game, b.rarity) - rarityRank(game, a.rarity)
    if (rarityDiff !== 0) return rarityDiff

    const cardNumberDiff = cardNumberNumerator(b.cardNumber) - cardNumberNumerator(a.cardNumber)
    if (cardNumberDiff !== 0) return cardNumberDiff

    return a.id.localeCompare(b.id)
  }
}
