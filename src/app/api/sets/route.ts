import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Game, Language } from '@prisma/client'
import { groupAndSortSets } from '@/lib/sort-card-sets'
import { cardsReadIpLimiter, getClientIp } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const { success } = await cardsReadIpLimiter.limit(getClientIp(req))
  if (!success) {
    return Response.json({ error: 'RATE_LIMITED' }, { status: 429, headers: { 'Cache-Control': 'no-store' } })
  }

  const game = req.nextUrl.searchParams.get('game')
  if (!game || !Object.values(Game).includes(game as Game)) {
    return Response.json({ error: 'game is required' }, { status: 400 })
  }

  const rawLang = req.nextUrl.searchParams.get('language')
  const language: Language =
    rawLang && Object.values(Language).includes(rawLang as Language)
      ? (rawLang as Language)
      : 'EN'

  const sets = await prisma.cardSet.findMany({
    where: { game: game as Game, language },
    select: { id: true, name: true, series: true, externalId: true, releaseDate: true },
  })

  // 依 series 分組 + 排序（組內 releaseDate desc，null 以 externalId 降冪遞補；組間依 latestRelease desc）
  const groups = groupAndSortSets(sets)

  return Response.json({ groups })
}
