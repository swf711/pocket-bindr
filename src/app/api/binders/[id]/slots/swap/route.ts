import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePublicBinder } from '@/lib/binder-cache'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id: binderId } = await context.params

  const binder = await prisma.binder.findUnique({ where: { id: binderId } })
  if (!binder) return Response.json({ error: 'Not found' }, { status: 404 })
  if (binder.userId !== session.user.id) return Response.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { slotAId, slotBId } = body as Record<string, unknown>
  if (typeof slotAId !== 'string' || typeof slotBId !== 'string') {
    return Response.json({ error: 'slotAId and slotBId are required strings' }, { status: 400 })
  }

  const [slotA, slotB] = await Promise.all([
    prisma.binderSlot.findUnique({ where: { id: slotAId } }),
    prisma.binderSlot.findUnique({ where: { id: slotBId } }),
  ])

  if (!slotA || slotA.binderId !== binderId || !slotB || slotB.binderId !== binderId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use temp position (-1, -1) to avoid unique constraint on [binderId, pageNumber, slotIndex]
  const [updatedA, updatedB] = await prisma.$transaction(async (tx) => {
    await tx.binderSlot.update({ where: { id: slotAId }, data: { pageNumber: -1, slotIndex: -1 } })
    const b = await tx.binderSlot.update({
      where: { id: slotBId },
      data: { pageNumber: slotA.pageNumber, slotIndex: slotA.slotIndex },
      select: { id: true, pageNumber: true, slotIndex: true },
    })
    const a = await tx.binderSlot.update({
      where: { id: slotAId },
      data: { pageNumber: slotB.pageNumber, slotIndex: slotB.slotIndex },
      select: { id: true, pageNumber: true, slotIndex: true },
    })
    return [a, b]
  })

  revalidatePublicBinder(binder.shareToken)
  return Response.json({ slotA: updatedA, slotB: updatedB })
}
