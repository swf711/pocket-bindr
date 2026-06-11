import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string; slotId: string }> }

async function getBinderAndSlot(binderId: string, slotId: string, userId: string) {
  const binder = await prisma.binder.findUnique({ where: { id: binderId } })
  if (!binder) {
    return { binder: null, slot: null, error: Response.json({ error: 'Not found' }, { status: 404 }) }
  }
  if (binder.userId !== userId) {
    return { binder: null, slot: null, error: Response.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  const slot = await prisma.binderSlot.findUnique({ where: { id: slotId } })
  if (!slot || slot.binderId !== binderId) {
    return { binder, slot: null, error: Response.json({ error: 'Not found' }, { status: 404 }) }
  }
  return { binder, slot, error: null }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id
  const { id: binderId, slotId } = await context.params
  const { slot, error } = await getBinderAndSlot(binderId, slotId, userId)
  if (error) return error

  await prisma.$transaction(async (tx) => {
    await tx.binderSlot.delete({ where: { id: slotId } })
    if (slot!.cardId && slot!.status) {
      const userCard = await tx.userCard.findUnique({
        where: {
          userId_cardId_status: {
            userId,
            cardId: slot!.cardId,
            status: slot!.status,
          },
        },
      })
      if (userCard) {
        if (userCard.quantity <= 1) {
          await tx.userCard.delete({ where: { id: userCard.id } })
        } else {
          await tx.userCard.update({ where: { id: userCard.id }, data: { quantity: { decrement: 1 } } })
        }
      }
    }
  })

  return Response.json({ deleted: true })
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id: binderId, slotId } = await context.params
  const { error } = await getBinderAndSlot(binderId, slotId, session.user.id)
  if (error) return error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { pageNumber, slotIndex } = body as Record<string, unknown>
  if (typeof pageNumber !== 'number' || typeof slotIndex !== 'number') {
    return Response.json({ error: 'pageNumber and slotIndex are required numbers' }, { status: 400 })
  }

  const updated = await prisma.binderSlot.update({
    where: { id: slotId },
    data: { pageNumber, slotIndex },
    select: { id: true, pageNumber: true, slotIndex: true },
  })
  return Response.json(updated)
}
