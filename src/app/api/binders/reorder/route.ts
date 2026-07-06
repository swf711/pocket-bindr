import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 不重用 src/lib/schemas/binder.ts 的 bindersReorderSchema：該 schema 對陣列元素
// 額外套用 min(1)，會讓「空字串」id 提早被拒（原本行為是 typeof 檢查即可通過，
// 空字串之後在 DB 查詢比對時自然找不到、回 403），為完全保留原行為改用本地寬鬆 schema。
const orderedIdsSchema = z.array(z.string()).min(1)

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { orderedIds: rawOrderedIds } = body as Record<string, unknown>
  const orderedIdsResult = orderedIdsSchema.safeParse(rawOrderedIds)
  if (!orderedIdsResult.success) {
    return Response.json({ error: 'orderedIds must be a non-empty array of strings' }, { status: 400 })
  }
  const orderedIds = orderedIdsResult.data

  const binders = await prisma.binder.findMany({
    where: { id: { in: orderedIds } },
    select: { id: true, userId: true },
  })

  if (binders.length !== orderedIds.length) {
    return Response.json({ error: 'invalid orderedIds' }, { status: 400 })
  }

  const unauthorized = binders.find(b => b.userId !== userId)
  if (unauthorized) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.binder.update({ where: { id }, data: { sortOrder: index } })
    )
  )

  return Response.json({ ok: true })
}
