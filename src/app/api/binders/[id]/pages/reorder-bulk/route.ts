import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePublicBinder } from '@/lib/binder-cache'
import { slotDisplaySelect, toDisplaySlot } from '@/lib/slot-display'
import { pagesReorderBulkSchema } from '@/lib/schemas/binder'

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

  const parsed = pagesReorderBulkSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'newOrder must be a non-empty array of positive integers' }, { status: 400 })
  }
  const { newOrder } = parsed.data

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

    // ⚠️ 必須走 slotDisplaySelect + toDisplaySlot（與其他所有格位讀取路徑一致）。
    // 這裡曾經是全站唯一自己寫 select 的地方，少了 displayCard 與 group，導致重排後
    // ①OPCG ZH_TW alias 卡退回 canonical 日文名 ②跨格群組的 span 掉失、N 格各自
    // 變成一張完整合成圖——都要重整頁面才恢復。
    const reordered = await tx.binderSlot.findMany({
      where: { binderId: id, cardId: { not: null } },
      orderBy: [{ pageNumber: 'asc' }, { slotIndex: 'asc' }],
      select: slotDisplaySelect,
    })
    return reordered.map(toDisplaySlot)
  })

  revalidatePublicBinder(binder!.shareToken)
  return Response.json({ slots })
}
