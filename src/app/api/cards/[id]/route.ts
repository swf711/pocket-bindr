import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getCollectionStatusMap, resolveCollectionLookupId } from '@/lib/card-collection-status'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    return await handleGet(context)
  } catch (err) {
    console.error('[GET /api/cards/[id]]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleGet(context: RouteContext) {
  const { id } = await context.params

  const card = await prisma.card.findUnique({
    where: { id },
    include: {
      set: true,
      canonicalCard: {
        select: { id: true, imageSmall: true, imageLarge: true, language: true },
      },
    },
  })
  if (!card) {
    return Response.json({ error: 'Card not found' }, { status: 404 })
  }

  const session = await auth()
  const collectionMap = await getCollectionStatusMap([card], session?.user?.id, true)
  const lookupId = resolveCollectionLookupId(card)

  return Response.json({
    ...card,
    collectionStatus: collectionMap[lookupId] ?? { owned: null, wanted: null },
  })
}
