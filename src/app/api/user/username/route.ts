import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { usernameSchema } from '@/lib/schemas/user'

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { username } = body as { username: unknown }

    const parsed = usernameSchema.safeParse(username)
    if (!parsed.success) {
      return Response.json({ error: 'INVALID_USERNAME' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({
      where: { username: parsed.data },
      select: { id: true },
    })
    if (existing && existing.id !== session.user.id) {
      return Response.json({ error: 'USERNAME_TAKEN' }, { status: 409 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { username: parsed.data },
    })

    return Response.json({ success: true })
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') {
      return Response.json({ error: 'USERNAME_TAKEN' }, { status: 409 })
    }
    console.error('[PATCH /api/user/username]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
