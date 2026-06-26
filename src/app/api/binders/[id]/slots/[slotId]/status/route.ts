import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CardStatus } from '@prisma/client'
import { revalidatePublicBinder } from '@/lib/binder-cache'

type RouteContext = { params: Promise<{ id: string; slotId: string }> }

export async function PATCH(_request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id
  const { id: binderId, slotId } = await context.params

  const binder = await prisma.binder.findUnique({ where: { id: binderId } })
  if (!binder) return Response.json({ error: 'Not found' }, { status: 404 })
  if (binder.userId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const slot = await prisma.binderSlot.findUnique({ where: { id: slotId } })
  if (!slot || slot.binderId !== binderId) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  if (!slot.cardId || !slot.status) {
    return Response.json({ error: 'Slot has no card' }, { status: 400 })
  }

  const oldStatus = slot.status
  const newStatus: CardStatus = oldStatus === 'owned' ? 'wanted' : 'owned'

  await prisma.$transaction(async (tx) => {
    await tx.binderSlot.update({ where: { id: slotId }, data: { status: newStatus } })

    const oldUserCard = await tx.userCard.findUnique({
      where: { userId_cardId_status: { userId, cardId: slot.cardId!, status: oldStatus } },
    })
    if (oldUserCard) {
      if (oldUserCard.quantity <= 1) {
        await tx.userCard.delete({ where: { id: oldUserCard.id } })
      } else {
        await tx.userCard.update({ where: { id: oldUserCard.id }, data: { quantity: { decrement: 1 } } })
      }
    }

    await tx.userCard.upsert({
      where: { userId_cardId_status: { userId, cardId: slot.cardId!, status: newStatus } },
      // 沿用格位的 displayCardId 保留原始顯示語言（OPCG ZH_TW alias）；首次寫入保留
      create: { userId, cardId: slot.cardId!, status: newStatus, quantity: 1, displayCardId: slot.displayCardId },
      update: { quantity: { increment: 1 } },
    })
  })

  revalidatePublicBinder(binder.shareToken)
  return Response.json({ id: slotId, status: newStatus })
}
