import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

async function getBinderOrError(id: string, userId: string) {
  const binder = await prisma.binder.findUnique({ where: { id } })
  if (!binder) {
    return { binder: null, error: Response.json({ error: 'Not found' }, { status: 404 }) }
  }
  if (binder.userId !== userId) {
    return { binder: null, error: Response.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { binder, error: null }
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await context.params
  const { error } = await getBinderOrError(id, session.user.id)
  if (error) return error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { newOrder } = body as Record<string, unknown>
  if (
    !Array.isArray(newOrder) ||
    newOrder.length === 0 ||
    !newOrder.every((p) => typeof p === 'number' && Number.isInteger(p) && p >= 1)
  ) {
    return Response.json({ error: 'newOrder must be a non-empty array of positive integers' }, { status: 400 })
  }

  const n = newOrder.length
  const sorted = [...newOrder].sort((a, b) => a - b)
  if (sorted.some((p, i) => p !== i + 1)) {
    return Response.json({ error: 'newOrder must be a complete permutation of 1..N' }, { status: 400 })
  }

  const slots = await prisma.$transaction(async (tx) => {
    // Step 1: move all slots to temp negative page numbers to avoid unique constraint violations
    await tx.$executeRaw`
      UPDATE "BinderSlot"
      SET "pageNumber" = -"pageNumber"
      WHERE "binderId" = ${id} AND "pageNumber" BETWEEN 1 AND ${n}
    `
    // Step 2: assign each old page (now negative) its new page number
    // newOrder[i] is the old page number that should become page i+1
    for (let newPage = 1; newPage <= n; newPage++) {
      const oldPage = newOrder[newPage - 1] as number
      await tx.$executeRaw`
        UPDATE "BinderSlot"
        SET "pageNumber" = ${newPage}
        WHERE "binderId" = ${id} AND "pageNumber" = ${-oldPage}
      `
    }

    return tx.binderSlot.findMany({
      where: { binderId: id, cardId: { not: null } },
      orderBy: [{ pageNumber: 'asc' }, { slotIndex: 'asc' }],
      select: {
        id: true,
        binderId: true,
        cardId: true,
        pageNumber: true,
        slotIndex: true,
        status: true,
        card: {
          select: {
            id: true,
            name: true,
            imageSmall: true,
            language: true,
            cardNumber: true,
            rarity: true,
          },
        },
      },
    })
  })

  return Response.json({ slots })
}
