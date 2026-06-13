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

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await context.params
  const { binder, error } = await getBinderOrError(id, session.user.id)
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

  const newTotalPages = currentTotalPages + 1
  await prisma.binder.update({
    where: { id },
    data: { settings: { ...settings, totalPages: newTotalPages } },
  })

  return Response.json({ totalPages: newTotalPages })
}
