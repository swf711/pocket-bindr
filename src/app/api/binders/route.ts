import { GridType } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DEFAULT_COVER_COLOR } from '@/lib/cover-colors'
import { MAX_BINDERS_PER_USER } from '@/lib/binder-limits'
import { GRID_TYPE_VALUES, hexColorSchema } from '@/lib/schemas/common'
import { binderCreateSchema } from '@/lib/schemas/binder'

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

  const { name, gridType, coverColor, description } = body as Record<string, unknown>

  if (!binderCreateSchema.shape.name.safeParse(name).success) {
    return Response.json(
      { error: 'name is required and must be a non-empty string of at most 50 characters' },
      { status: 400 },
    )
  }
  const trimmedName = (name as string).trim()

  if (!binderCreateSchema.shape.gridType.safeParse(gridType).success) {
    return Response.json(
      { error: `gridType must be one of: ${GRID_TYPE_VALUES.join(', ')}` },
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
  if (!hexColorSchema.safeParse(resolvedColor).success) {
    return Response.json({ error: 'coverColor must be a valid hex color (e.g. #4A5568)' }, { status: 400 })
  }

  // description 的用戶端 zod schema（見 src/lib/schemas/binder.ts descriptionSchema）在表單送出前
  // 已把空字串 transform 成 null（RHF 送出的是 resolver 的「輸出」型別，非原始輸入型別），
  // 故這裡的 shape.description（驗證原始輸入用）需額外放行 null，否則「未填描述」會被誤判成不合法輸入而 400。
  if (
    description !== undefined &&
    description !== null &&
    !binderCreateSchema.shape.description.safeParse(description).success
  ) {
    return Response.json({ error: 'description must be a string of at most 150 characters' }, { status: 400 })
  }

  const maxOrder = await prisma.binder.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  })
  const nextSortOrder = (maxOrder._max.sortOrder ?? -1) + 1

  const binder = await prisma.binder.create({
    data: {
      userId,
      name: trimmedName,
      gridType: gridType as GridType,
      coverColor: resolvedColor as string,
      description: typeof description === 'string' ? description.trim() || null : null,
      sortOrder: nextSortOrder,
    },
    include: { _count: { select: { slots: true } } },
  })

  return Response.json(binder, { status: 201 })
}
