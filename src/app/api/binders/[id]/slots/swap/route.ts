import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePublicBinder } from '@/lib/binder-cache'

type RouteContext = { params: Promise<{ id: string }> }

// 不重用 src/lib/schemas/binder.ts 的 slotsSwapSchema：該 schema 對兩個 id 額外套用
// min(1)，會讓空字串提早被拒（原本行為是 typeof 檢查即可通過，空字串之後在 DB
// 查詢比對時自然找不到、回 403），為完全保留原行為改用本地寬鬆 schema。
const slotIdsSchema = z.object({ slotAId: z.string(), slotBId: z.string() })

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

  const parsed = slotIdsSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'slotAId and slotBId are required strings' }, { status: 400 })
  }
  const { slotAId, slotBId } = parsed.data

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
