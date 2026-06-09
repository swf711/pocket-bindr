import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Game } from '@prisma/client'

export async function GET(req: NextRequest) {
  const game = req.nextUrl.searchParams.get('game')

  if (!game || !Object.values(Game).includes(game as Game)) {
    return Response.json({ error: 'game is required' }, { status: 400 })
  }

  const sets = await prisma.cardSet.findMany({
    where: { game: game as Game },
    orderBy: { releaseDate: 'desc' },
    select: { id: true, name: true, series: true, releaseDate: true },
  })

  return Response.json({ sets })
}
