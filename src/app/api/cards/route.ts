import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { parseLanguage } from '@/lib/language'
import { Game, Prisma } from '@prisma/client'
import { groupAndSortSets } from '@/lib/sort-card-sets'
import { getCollectionStatusMap, resolveCollectionLookupId } from '@/lib/card-collection-status'

export async function GET(req: NextRequest) {
  try {
    return await handleGet(req)
  } catch (err) {
    console.error('[GET /api/cards]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleGet(req: NextRequest) {
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
  const include = {
    set: true,
    ...(includeCanonical && {
      canonicalCard: {
        select: { id: true, imageSmall: true, imageLarge: true, language: true },
      },
    }),
  }
  const skip = (pageNum - 1) * pageSizeNum

  let cards
  let total: number
  if (setId) {
    // 已選單一系列：依卡號排序即可
    ;[cards, total] = await Promise.all([
      prisma.card.findMany({ where, include, skip, take: pageSizeNum, orderBy: [{ cardNumber: 'asc' }] }),
      prisma.card.count({ where }),
    ])
  } else {
    // 所有系列：卡牌依「系列篩選選項」相同的 CardSet 排序（series 分組、組內 releaseDate desc／externalId 遞補）
    const setRows = await prisma.cardSet.findMany({
      where: { game: game as Game, language },
      select: { id: true, name: true, series: true, externalId: true, releaseDate: true },
    })
    const orderedSetIds = groupAndSortSets(setRows).flatMap(g => g.sets.map(s => s.id))

    const conds: Prisma.Sql[] = [
      Prisma.sql`"game"::text = ${game}`,
      Prisma.sql`"language"::text = ${language}`,
    ]
    if (q) {
      conds.push(Prisma.sql`("name" ILIKE ${'%' + q + '%'} OR "externalId" ILIKE ${q + '%'})`)
    }
    const whereSql = Prisma.join(conds, ' AND ')

    const [idRows, count] = await Promise.all([
      prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT "id" FROM "Card"
        WHERE ${whereSql}
        ORDER BY array_position(${orderedSetIds}::text[], "setId") NULLS LAST, "cardNumber" ASC
        LIMIT ${pageSizeNum} OFFSET ${skip}
      `),
      prisma.card.count({ where }),
    ])
    total = count
    const pageIds = idRows.map(r => r.id)
    const fetched = await prisma.card.findMany({ where: { id: { in: pageIds } }, include })
    const byId = new Map(fetched.map(c => [c.id, c]))
    cards = pageIds.map(id => byId.get(id)).filter((c): c is NonNullable<typeof c> => Boolean(c))
  }

  const session = await auth()
  const collectionMap = await getCollectionStatusMap(cards, session?.user?.id, includeCanonical)

  return Response.json({
    cards: cards.map(card => {
      const lookupId = resolveCollectionLookupId(card)
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

