import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { parseLanguage } from '@/lib/language'
import { Game } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const game = searchParams.get('game')
  const q = searchParams.get('q')
  const setId = searchParams.get('setId')
  const pageNum = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)))

  if (!game || !Object.values(Game).includes(game as Game)) {
    return Response.json({ error: 'game is required' }, { status: 400 })
  }

  const language = parseLanguage(searchParams.get('language'))
  if (!language) {
    return Response.json({ error: 'language must be one of EN, JA, ZH_TW' }, { status: 400 })
  }

  const where = {
    game: game as Game,
    language,
    ...(q && {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { externalId: { startsWith: q, mode: 'insensitive' as const } },
      ],
    }),
    ...(setId && { setId }),
  }

  const includeCanonical = game === 'OPCG' && language === 'ZH_TW'

  const [cards, total] = await prisma.$transaction([
    prisma.card.findMany({
      where,
      include: {
        set: true,
        ...(includeCanonical && {
          canonicalCard: {
            select: { id: true, imageSmall: true, imageLarge: true, language: true },
          },
        }),
      },
      skip: (pageNum - 1) * pageSizeNum,
      take: pageSizeNum,
      orderBy: [
        { set: { releaseDate: 'desc' } },
        { cardNumber: 'asc' },
      ],
    }),
    prisma.card.count({ where }),
  ])

  const session = await auth()
  type CollectionEntry = { owned: number | null; wanted: number | null }
  let collectionMap: Record<string, CollectionEntry> = {}
  if (session?.user?.id) {
    const cardIds = cards.map(c => c.id)
    const canonicalIds = includeCanonical
      ? cards.flatMap(c => (c as { canonicalCardId?: string | null }).canonicalCardId ? [(c as { canonicalCardId: string }).canonicalCardId] : [])
      : []
    const allIds = [...new Set([...cardIds, ...canonicalIds])]
    if (allIds.length > 0) {
      const userCards = await prisma.userCard.findMany({
        where: { userId: session.user.id, cardId: { in: allIds } },
        select: { cardId: true, status: true, quantity: true },
      })
      for (const uc of userCards) {
        if (!collectionMap[uc.cardId]) {
          collectionMap[uc.cardId] = { owned: null, wanted: null }
        }
        if (uc.status === 'owned') {
          collectionMap[uc.cardId].owned = uc.quantity
        } else if (uc.status === 'wanted') {
          collectionMap[uc.cardId].wanted = uc.quantity
        }
      }
    }
  }

  return Response.json({
    cards: cards.map(card => {
      const canonicalCardId = (card as { canonicalCardId?: string | null }).canonicalCardId
      const lookupId = !card.isCollectible && canonicalCardId ? canonicalCardId : card.id
      return {
        ...card,
        collectionStatus: collectionMap[lookupId] ?? { owned: null, wanted: null },
      }
    }),
    total,
    page: pageNum,
    pageSize: pageSizeNum,
    totalPages: Math.ceil(total / pageSizeNum),
  })
}
