import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateShareToken } from '@/lib/share-token'

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

  if (binder!.shareToken) {
    const shareUrl = `${process.env.NEXTAUTH_URL}/b/${binder!.shareToken}`
    return Response.json({ shareToken: binder!.shareToken, shareUrl })
  }

  const shareToken = generateShareToken()
  await prisma.binder.update({ where: { id }, data: { shareToken } })

  const shareUrl = `${process.env.NEXTAUTH_URL}/b/${shareToken}`
  return Response.json({ shareToken, shareUrl })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const { error } = await getBinderOrError(id, session.user.id)
  if (error) return error

  await prisma.binder.update({ where: { id }, data: { shareToken: null } })
  return Response.json({ ok: true })
}
