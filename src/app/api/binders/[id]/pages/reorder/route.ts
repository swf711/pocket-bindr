import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePublicBinder } from '@/lib/binder-cache'
import { pagesSwapSchema } from '@/lib/schemas/binder'

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
  const { binder, error } = await getBinderOrError(id, session.user.id)
  if (error) return error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = pagesSwapSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'pageA and pageB must be distinct positive integers' }, { status: 400 })
  }
  const { pageA, pageB } = parsed.data

  const slots = await prisma.$transaction(async (tx) => {
    // Three-step swap using temp negatives to avoid unique constraint violations
    // Step 1: pageA slots → temp negative
    await tx.$executeRaw`
      UPDATE "BinderSlot"
      SET "pageNumber" = -"pageNumber"
      WHERE "binderId" = ${id} AND "pageNumber" = ${pageA}
    `
    // Step 2: pageB slots → pageA
    await tx.binderSlot.updateMany({
      where: { binderId: id, pageNumber: pageB },
      data: { pageNumber: pageA },
    })
    // Step 3: temp negative slots → pageB
    await tx.$executeRaw`
      UPDATE "BinderSlot"
      SET "pageNumber" = ${pageB}
      WHERE "binderId" = ${id} AND "pageNumber" = ${-pageA}
    `

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

  revalidatePublicBinder(binder!.shareToken)
  return Response.json({ slots })
}
