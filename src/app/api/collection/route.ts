import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { CardStatus, Game, Language, Prisma } from '@prisma/client'
import { parseLanguage } from '@/lib/language'
import { getCollectionStatusMap } from '@/lib/card-collection-status'

const validStatuses: string[] = Object.values(CardStatus)

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id
  const { searchParams } = req.nextUrl

  const statusParam = searchParams.get('status')
  const gameParam = searchParams.get('game')
  const languageParam = searchParams.get('language')
  const setId = searchParams.get('setId') ?? undefined
  const q = searchParams.get('q') ?? undefined
  const pageNum = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)))

  if (statusParam !== null && !validStatuses.includes(statusParam)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 })
  }
  if (gameParam !== null && !Object.values(Game).includes(gameParam as Game)) {
    return Response.json({ error: 'Invalid game' }, { status: 400 })
  }
  let language: Language | null | undefined
  if (languageParam !== null) {
    language = parseLanguage(languageParam)
    if (!language) {
      return Response.json({ error: 'language must be one of EN, JA, ZH_TW' }, { status: 400 })
    }
  }

  const where: Prisma.CardWhereInput = {
    userCards: {
      some: {
        userId,
        ...(statusParam ? { status: statusParam as CardStatus } : {}),
      },
    },
    ...(gameParam ? { game: gameParam as Game } : {}),
    ...(language ? { language } : {}),
    ...(setId ? { setId } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
  }

  const skip = (pageNum - 1) * pageSizeNum
  const [cards, total] = await Promise.all([
    prisma.card.findMany({
      where,
      include: { set: true },
      skip,
      take: pageSizeNum,
      orderBy: [
        { set: { releaseDate: { sort: 'desc', nulls: 'last' } } },
        { cardNumber: 'asc' },
      ],
    }),
    prisma.card.count({ where }),
  ])

  // includeCanonical=false: UserCard.cardId is always canonical already
  const collectionMap = await getCollectionStatusMap(cards, userId, false)

  return Response.json({
    cards: cards.map(card => ({
      ...card,
      collectionStatus: collectionMap[card.id] ?? { owned: null, wanted: null },
    })),
    total,
    page: pageNum,
    pageSize: pageSizeNum,
    totalPages: Math.ceil(total / pageSizeNum),
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const body = await req.json()
  const { cardId, status, deleteStatus } = body

  if (!cardId || typeof cardId !== 'string') {
    return Response.json({ error: 'cardId is required' }, { status: 400 })
  }

  if (status !== null && !validStatuses.includes(status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Resolve alias cards to their canonical (JA) counterpart
  const cardRecord = await prisma.card.findUnique({
    where: { id: cardId },
    select: { isCollectible: true, canonicalCardId: true },
  })
  const resolvedCardId = cardRecord && !cardRecord.isCollectible && cardRecord.canonicalCardId
    ? cardRecord.canonicalCardId
    : cardId

  if (status === null) {
    if (!deleteStatus || !validStatuses.includes(deleteStatus)) {
      return Response.json({ error: 'deleteStatus is required and must be a valid status' }, { status: 400 })
    }
    await prisma.userCard.deleteMany({
      where: { userId, cardId: resolvedCardId, status: deleteStatus },
    })
    return Response.json({ success: true, cardId: resolvedCardId, status: null })
  }

  const userCard = await prisma.userCard.upsert({
    where: { userId_cardId_status: { userId, cardId: resolvedCardId, status } },
    create: { userId, cardId: resolvedCardId, status },
    update: { status },
  })

  return Response.json({ success: true, cardId: resolvedCardId, status: userCard.status })
}
