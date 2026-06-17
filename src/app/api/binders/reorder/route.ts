import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

  const { orderedIds } = body as Record<string, unknown>
  if (!Array.isArray(orderedIds) || orderedIds.length === 0 || !orderedIds.every(id => typeof id === 'string')) {
    return Response.json({ error: 'orderedIds must be a non-empty array of strings' }, { status: 400 })
  }

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
