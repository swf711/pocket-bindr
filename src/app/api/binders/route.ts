import { GridType } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DEFAULT_COVER_COLOR } from '@/lib/cover-colors'
import { MAX_BINDERS_PER_USER } from '@/lib/binder-limits'

const VALID_GRID_TYPES = new Set<GridType>([
  'grid_1x2',
  'grid_2x2',
  'grid_3x3',
  'grid_4x3',
  'grid_4x4',
])

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  const binders = await prisma.binder.findMany({
    where: { userId },
    include: { _count: { select: { slots: true } } },
    orderBy: { sortOrder: 'asc' },
  })

  return Response.json(binders)
}

export async function POST(request: Request) {
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

  const { name, gridType, coverColor } = body as Record<string, unknown>

  if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 50) {
    return Response.json(
      { error: 'name is required and must be a non-empty string of at most 50 characters' },
      { status: 400 },
    )
  }

  if (!VALID_GRID_TYPES.has(gridType as GridType)) {
    return Response.json(
      { error: `gridType must be one of: ${[...VALID_GRID_TYPES].join(', ')}` },
      { status: 400 },
    )
  }

  const count = await prisma.binder.count({ where: { userId } })
  if (count >= MAX_BINDERS_PER_USER) {
    return Response.json(
      { error: 'binderLimitReached', max: MAX_BINDERS_PER_USER },
      { status: 409 },
    )
  }

  const resolvedColor = coverColor === undefined ? DEFAULT_COVER_COLOR : coverColor
  if (typeof resolvedColor !== 'string' || !HEX_COLOR_RE.test(resolvedColor)) {
    return Response.json({ error: 'coverColor must be a valid hex color (e.g. #4A5568)' }, { status: 400 })
  }

  const maxOrder = await prisma.binder.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  })
  const nextSortOrder = (maxOrder._max.sortOrder ?? -1) + 1

  const binder = await prisma.binder.create({
    data: {
      userId,
      name: name.trim(),
      gridType: gridType as GridType,
      coverColor: resolvedColor,
      sortOrder: nextSortOrder,
    },
    include: { _count: { select: { slots: true } } },
  })

  return Response.json(binder, { status: 201 })
}
