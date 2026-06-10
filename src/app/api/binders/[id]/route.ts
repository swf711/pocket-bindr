import { GridType } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VALID_GRID_TYPES = new Set<GridType>([
  'grid_1x2',
  'grid_2x2',
  'grid_3x3',
  'grid_3x4',
  'grid_4x4',
])

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
  const userId = session.user.id
  const { id } = await context.params

  const { error } = await getBinderOrError(id, userId)
  if (error) return error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, gridType } = body as Record<string, unknown>
  const updateData: { name?: string; gridType?: GridType } = {}

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 50) {
      return Response.json(
        { error: 'name must be a non-empty string of at most 50 characters' },
        { status: 400 },
      )
    }
    updateData.name = name.trim()
  }

  if (gridType !== undefined) {
    if (!VALID_GRID_TYPES.has(gridType as GridType)) {
      return Response.json(
        { error: `gridType must be one of: ${[...VALID_GRID_TYPES].join(', ')}` },
        { status: 400 },
      )
    }
    updateData.gridType = gridType as GridType
  }

  const updated = await prisma.binder.update({
    where: { id },
    data: updateData,
    include: { _count: { select: { slots: true } } },
  })

  return Response.json(updated)
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id
  const { id } = await context.params

  const { error } = await getBinderOrError(id, userId)
  if (error) return error

  await prisma.binder.delete({ where: { id } })

  return new Response(null, { status: 204 })
}
