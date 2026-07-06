import { unstable_cache } from 'next/cache'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { parseLanguage } from '@/lib/language'
import { Game, Language, Prisma } from '@prisma/client'
import { groupAndSortSets } from '@/lib/sort-card-sets'
import { getCollectionStatusMap, resolveCollectionLookupId } from '@/lib/card-collection-status'
import { parseSetCardQuery, buildSetCardPrismaWhere, buildSetCardSql } from '@/lib/parse-set-card-query'
import { buildCrossLangExpansion } from '@/lib/cross-language-search'
import { gameSchema } from '@/lib/schemas/collection'

export async function GET(req: NextRequest) {
  try {
    return await handleGet(req)
  } catch (err) {
    console.error('[GET /api/cards]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Fetch user-independent card data (cards + total). Cached per unique param combo.
// collection status is intentionally excluded to prevent cross-user data leakage.
function fetchCardPage(
  game: string,
  language: Game extends never ? never : string, // typed as string; caller has already null-checked
  q: string,
  setId: string,
  pageNum: number,
  pageSizeNum: number,
) {
  return unstable_cache(
    async () => {
      const lang = language as Language
      const parsed = q ? parseSetCardQuery(q) : null
      const { nameTerms, cardIds } = await buildCrossLangExpansion(prisma, game as Game, lang, q)
      const where = {
        game: game as Game,
        language: lang,
        ...(q && {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { externalId: { startsWith: q, mode: 'insensitive' as const } },
            ...(parsed ? [buildSetCardPrismaWhere(parsed)] : []),
            ...nameTerms.map(term => ({ name: { contains: term, mode: 'insensitive' as const } })),
            ...(cardIds.length ? [{ id: { in: cardIds } }] : []),
          ],
        }),
        ...(setId && { setId }),
      }
      const includeCanonical = game === 'OPCG' && lang === 'ZH_TW'
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
        ;[cards, total] = await Promise.all([
          prisma.card.findMany({ where, include, skip, take: pageSizeNum, orderBy: [{ cardNumber: 'asc' }] }),
          prisma.card.count({ where }),
        ])
      } else {
        const setRows = await prisma.cardSet.findMany({
          where: { game: game as Game, language: lang },
          select: { id: true, name: true, series: true, externalId: true, releaseDate: true },
        })
        const orderedSetIds = groupAndSortSets(setRows).flatMap(g => g.sets.map(s => s.id))
        const conds: Prisma.Sql[] = [
          Prisma.sql`"game"::text = ${game}`,
          Prisma.sql`"language"::text = ${language}`,
        ]
        if (q) {
          const orParts = [Prisma.sql`"name" ILIKE ${'%' + q + '%'}`, Prisma.sql`"externalId" ILIKE ${q + '%'}`]
          if (parsed) orParts.push(buildSetCardSql(parsed))
          for (const term of nameTerms) {
            orParts.push(Prisma.sql`"name" ILIKE ${'%' + term + '%'}`)
          }
          if (cardIds.length) {
            orParts.push(Prisma.sql`"id" = ANY(${cardIds}::text[])`)
          }
          conds.push(Prisma.sql`(${Prisma.join(orParts, ' OR ')})`)
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
      return { cards, total, includeCanonical }
    },
    ['cards-page', game, language, q, setId, String(pageNum), String(pageSizeNum)],
    { revalidate: 60, tags: ['cards-page'] },
  )()
}

async function handleGet(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const game = searchParams.get('game')
  const q = searchParams.get('q') ?? ''
  const setId = searchParams.get('setId') ?? ''
  const pageNum = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)))

  const gameResult = gameSchema.safeParse(game)
  if (!gameResult.success) {
    return Response.json({ error: 'game is required' }, { status: 400 })
  }
  const validGame = gameResult.data

  const language = parseLanguage(searchParams.get('language'))
  if (!language) {
    return Response.json({ error: 'language must be one of EN, JA, ZH_TW' }, { status: 400 })
  }

  // auth() 與卡片查詢並行，避免串行多一段 round trip（尤其跨 region 時）
  const sessionPromise = auth()

  const { cards, total, includeCanonical } = await fetchCardPage(validGame, language, q, setId, pageNum, pageSizeNum)

  const session = await sessionPromise
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

