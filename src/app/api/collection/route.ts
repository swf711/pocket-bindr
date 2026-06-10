import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { CardStatus } from '@prisma/client'

const validStatuses: string[] = Object.values(CardStatus)

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const body = await req.json()
  const { cardId, status, deleteStatus } = body

  if (!cardId || typeof cardId !== 'string') {
    return Response.json({ error: 'cardId is required' }, { status: 400 })
  }

  if (status !== null && !validStatuses.includes(status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 })
  }

  if (status === null) {
    if (!deleteStatus || !validStatuses.includes(deleteStatus)) {
      return Response.json({ error: 'deleteStatus is required and must be a valid status' }, { status: 400 })
    }
    await prisma.userCard.deleteMany({
      where: { userId, cardId, status: deleteStatus },
    })
    return Response.json({ success: true, cardId, status: null })
  }

  const userCard = await prisma.userCard.upsert({
    where: { userId_cardId_status: { userId, cardId, status } },
    create: { userId, cardId, status },
    update: { status },
  })

  return Response.json({ success: true, cardId, status: userCard.status })
}
