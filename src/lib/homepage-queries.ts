import { Game, Language } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCardImageUrl } from '@/lib/get-card-image-url'

export type FeaturedCard = {
  id: string
  name: string
  imageSmall: string
  rarity: string
  setName: string
}

export type LatestSet = {
  id: string
  name: string
  game: Game
  language: Language
  symbolUrl: string | null
  releaseDate: Date
  totalCards: number
  externalId: string
}

const FEATURED_RARITIES = [
  'Special Illustration Rare',
  'Hyper Rare',
  'Ultra Rare',
  'Illustration Rare',
  'Double Rare',
  'Rare Holo ex',
  'Secret Rare',
]

export async function getFeaturedCards(): Promise<FeaturedCard[]> {
  const cards = await prisma.card.findMany({
    where: {
      game: 'PTCG',
      language: 'EN',
      isCollectible: true,
      rarity: { in: FEATURED_RARITIES },
      imageSmall: { not: '' },
    },
    select: {
      id: true,
      name: true,
      imageSmall: true,
      rarity: true,
      set: { select: { name: true } },
    },
    orderBy: [{ rarity: 'asc' }, { id: 'asc' }],
    take: 8,
  })

  return cards.map((card) => ({
    id: card.id,
    name: card.name,
    imageSmall: getCardImageUrl(card.imageSmall) ?? card.imageSmall,
    rarity: card.rarity ?? '',
    setName: card.set.name,
  }))
}

export async function getLatestSets(limit = 6): Promise<LatestSet[]> {
  const sets = await prisma.cardSet.findMany({
    where: { releaseDate: { not: null } },
    orderBy: { releaseDate: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      game: true,
      language: true,
      symbolUrl: true,
      releaseDate: true,
      totalCards: true,
      externalId: true,
    },
  })

  return sets.map((s) => ({
    ...s,
    releaseDate: s.releaseDate!,
  }))
}
