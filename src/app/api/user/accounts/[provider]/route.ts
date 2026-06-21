import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { provider } = await params
  if (!['google', 'discord'].includes(provider)) {
    return Response.json({ error: 'INVALID_PROVIDER' }, { status: 400 })
  }

  const userId = session.user.id

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true, accounts: { select: { provider: true } } },
      })
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

      const isLinked = user.accounts.some((a) => a.provider === provider)
      if (!isLinked) return Response.json({ error: 'NOT_LINKED' }, { status: 404 })

      const totalMethods = (user.passwordHash !== null ? 1 : 0) + user.accounts.length
      if (totalMethods === 1) {
        return Response.json({ error: 'lastLoginMethodRemoval' }, { status: 409 })
      }

      await tx.account.deleteMany({ where: { userId, provider } })
      return Response.json({ success: true })
    })
  } catch {
    return Response.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
