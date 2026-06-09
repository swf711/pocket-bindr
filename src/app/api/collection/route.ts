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
  const { cardId, status } = body

  if (!cardId || typeof cardId !== 'string') {
    return Response.json({ error: 'cardId is required' }, { status: 400 })
  }

  if (status !== null && !validStatuses.includes(status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 })
  }

  if (status === null) {
    await prisma.userCard.deleteMany({
      where: { userId, cardId },
    })
    return Response.json({ success: true, cardId, status: null })
  }

  const userCard = await prisma.userCard.upsert({
    where: { userId_cardId: { userId, cardId } },
    create: { userId, cardId, status },
    update: { status },
  })

  return Response.json({ success: true, cardId, status: userCard.status })
}
