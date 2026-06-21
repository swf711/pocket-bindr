import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(_request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // userId only comes from session, never from external input
    const userId = session.user.id

    await prisma.user.delete({ where: { id: userId } })
    // Cascade removes: Account / Session / UserCard / Binder / BinderSlot

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
