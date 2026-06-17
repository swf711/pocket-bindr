import { GridType } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeSlotMigration, decrementUserCardsForSlots } from '@/lib/binder-utils'
import { GRID_TYPE_SLOTS } from '@/types/binder'

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/

const VALID_GRID_TYPES = new Set<GridType>([
  'grid_1x2',
  'grid_2x2',
  'grid_3x3',
  'grid_4x3',
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

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await context.params
  const { error } = await getBinderOrError(id, session.user.id)
  if (error) return error

  const binderWithSlots = await prisma.binder.findUnique({
    where: { id },
    include: {
      slots: {
        where: { cardId: { not: null } },
        orderBy: [{ pageNumber: 'asc' }, { slotIndex: 'asc' }],
        select: {
          id: true,
          binderId: true,
          cardId: true,
          pageNumber: true,
          slotIndex: true,
          status: true,
          card: {
            select: {
              id: true,
              name: true,
              imageSmall: true,
              language: true,
              cardNumber: true,
              rarity: true,
            },
          },
        },
      },
    },
  })

  return Response.json({
    id: binderWithSlots!.id,
    name: binderWithSlots!.name,
    gridType: binderWithSlots!.gridType,
    coverColor: binderWithSlots!.coverColor,
    slots: binderWithSlots!.slots,
  })
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id
  const { id } = await context.params

  const { binder: currentBinder, error } = await getBinderOrError(id, userId)
  if (error) return error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, gridType, coverColor, description } = body as Record<string, unknown>
  const updateData: { name?: string; gridType?: GridType; coverColor?: string; description?: string | null } = {}

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

  if (coverColor !== undefined) {
    if (typeof coverColor !== 'string' || !HEX_COLOR_RE.test(coverColor)) {
      return Response.json({ error: 'coverColor must be a valid hex color (e.g. #4A5568)' }, { status: 400 })
    }
    updateData.coverColor = coverColor
  }

  if (description !== undefined) {
    if (typeof description !== 'string' && description !== null) {
      return Response.json({ error: 'description must be a string or null' }, { status: 400 })
    }
    if (typeof description === 'string' && description.trim().length > 150) {
      return Response.json({ error: 'description must be at most 150 characters' }, { status: 400 })
    }
    updateData.description = typeof description === 'string' ? description.trim() || null : null
  }

  // When gridType shrinks, repack out-of-bounds slots onto new pages
  const newGridType = updateData.gridType
  let affectedSlotsCount = 0

  if (
    newGridType !== undefined &&
    GRID_TYPE_SLOTS[newGridType] < GRID_TYPE_SLOTS[currentBinder!.gridType]
  ) {
    const newSlotsPerPage = GRID_TYPE_SLOTS[newGridType]
    const currentSettings = currentBinder!.settings as { totalPages?: number } | null
    const currentTotalPages = Math.max(currentSettings?.totalPages ?? 0, 1)

    const overflowSlots = await prisma.binderSlot.findMany({
      where: { binderId: id, slotIndex: { gte: newSlotsPerPage } },
      select: { id: true, pageNumber: true, slotIndex: true },
    })

    if (overflowSlots.length > 0) {
      const migrations = computeSlotMigration(overflowSlots, newSlotsPerPage, currentTotalPages)
      const newTotalPages =
        currentTotalPages + Math.ceil(overflowSlots.length / newSlotsPerPage)

      const currentSettingsObj = (currentBinder!.settings as Record<string, unknown>) ?? {}
      const newSettings = { ...currentSettingsObj, totalPages: newTotalPages }

      const [updated] = await prisma.$transaction([
        prisma.binder.update({
          where: { id },
          data: {
            name: updateData.name,
            gridType: updateData.gridType,
            coverColor: updateData.coverColor,
            settings: newSettings,
          },
          include: { _count: { select: { slots: true } } },
        }),
        ...migrations.map((m) =>
          prisma.binderSlot.update({
            where: { id: m.id },
            data: { pageNumber: m.newPageNumber, slotIndex: m.newSlotIndex },
          }),
        ),
      ])

      affectedSlotsCount = migrations.length
      return Response.json({ ...updated, affectedSlotsCount })
    }
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

  await prisma.$transaction(async (tx) => {
    const slots = await tx.binderSlot.findMany({
      where: { binderId: id, cardId: { not: null } },
      select: { cardId: true, status: true },
    })
    await decrementUserCardsForSlots(tx, userId, slots)
    await tx.binder.delete({ where: { id } })
  })

  return new Response(null, { status: 204 })
}
