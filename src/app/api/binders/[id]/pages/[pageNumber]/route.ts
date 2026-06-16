import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrementUserCardsForSlots } from '@/lib/binder-utils'

type RouteContext = { params: Promise<{ id: string; pageNumber: string }> }

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

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id
  const { id, pageNumber: pageNumberStr } = await context.params
  const pageNumber = parseInt(pageNumberStr, 10)

  if (isNaN(pageNumber) || pageNumber < 1) {
    return Response.json({ error: 'Invalid page number' }, { status: 400 })
  }

  const { binder, error } = await getBinderOrError(id, userId)
  if (error) return error

  const settings = (binder!.settings as Record<string, unknown> | null) ?? {}
  let currentTotalPages = typeof settings.totalPages === 'number' ? settings.totalPages : 0
  if (currentTotalPages === 0) {
    const lastSlot = await prisma.binderSlot.findFirst({
      where: { binderId: id },
      orderBy: { pageNumber: 'desc' },
    })
    currentTotalPages = lastSlot?.pageNumber ?? 1
  }

  if (currentTotalPages <= 1) {
    return Response.json({ error: '至少保留一頁' }, { status: 400 })
  }

  if (pageNumber > currentTotalPages) {
    return Response.json({ error: 'Page not found' }, { status: 404 })
  }

  const newTotalPages = currentTotalPages - 1

  const slots = await prisma.$transaction(async (tx) => {
    // Get all filled slots on the target page to update UserCard quantities
    const slotsOnPage = await tx.binderSlot.findMany({
      where: { binderId: id, pageNumber, cardId: { not: null } },
    })

    await decrementUserCardsForSlots(tx, userId, slotsOnPage)

    // Delete all slots on the target page (both filled and empty)
    await tx.binderSlot.deleteMany({ where: { binderId: id, pageNumber } })

    // Shift subsequent pages down by 1 using two-step to avoid unique constraint issues:
    // Step 1: move to temp negatives
    await tx.$executeRaw`
      UPDATE "BinderSlot"
      SET "pageNumber" = -"pageNumber"
      WHERE "binderId" = ${id} AND "pageNumber" > ${pageNumber}
    `
    // Step 2: shift to final value (negate and subtract 1)
    await tx.$executeRaw`
      UPDATE "BinderSlot"
      SET "pageNumber" = -"pageNumber" - 1
      WHERE "binderId" = ${id} AND "pageNumber" < 0
    `

    // Update totalPages in settings
    await tx.binder.update({
      where: { id },
      data: { settings: { ...settings, totalPages: newTotalPages } },
    })

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

  return Response.json({ totalPages: newTotalPages, slots })
}
