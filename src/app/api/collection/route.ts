import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { CardStatus, Game, Language, Prisma } from '@prisma/client'
import { parseLanguage } from '@/lib/language'
import { deriveDisplayCardId } from '@/lib/resolve-canonical-card'
import { getDisplayCollectionStatusMap } from '@/lib/card-collection-status'

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

  // 以「顯示身份」聚合：一張 Card 是某收藏的顯示卡，當
  // (1) 它是 alias 且被 UserCard.displayCardId 指向（OPCG ZH_TW 經 alias 加入），或
  // (2) 它被直接加入（UserCard.cardId = 自身、displayCardId = null，含遷移前既有資料）。
  const userCardFilter = statusParam ? { userId, status: statusParam as CardStatus } : { userId }
  const where: Prisma.CardWhereInput = {
    OR: [
      { displayUserCards: { some: userCardFilter } },
      { userCards: { some: { ...userCardFilter, displayCardId: null } } },
    ],
    ...(gameParam ? { game: gameParam as Game } : {}),
    ...(language ? { language } : {}),
    ...(setId ? { setId } : {}),
    ...(q ? {
      AND: [
        {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { externalId: { startsWith: q, mode: 'insensitive' as const } },
          ],
        },
      ],
    } : {}),
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

  // cards 為「顯示卡」，以 displayCardId ?? cardId 為 key 聚合狀態
  const collectionMap = await getDisplayCollectionStatusMap(cards.map(c => c.id), userId)

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
  // 保留原始顯示語言：alias 加入時記下原 cardId（ZH_TW），純 canonical 則 null
  const displayCardId = deriveDisplayCardId(cardId, resolvedCardId)

  if (status === null) {
    if (!deleteStatus || !validStatuses.includes(deleteStatus)) {
      return Response.json({ error: 'deleteStatus is required and must be a valid status' }, { status: 400 })
    }
    await prisma.userCard.deleteMany({
      where: { userId, cardId: resolvedCardId, status: deleteStatus },
    })
    return Response.json({ success: true, cardId: resolvedCardId, status: null })
  }

  // 首次寫入保留 displayCardId；既有紀錄（update）不覆蓋
  const userCard = await prisma.userCard.upsert({
    where: { userId_cardId_status: { userId, cardId: resolvedCardId, status } },
    create: { userId, cardId: resolvedCardId, status, displayCardId },
    update: { status },
  })

  return Response.json({ success: true, cardId: resolvedCardId, status: userCard.status })
}
