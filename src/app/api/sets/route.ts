import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Game, Language } from '@prisma/client'
import { SetGroup } from '@/types/card'

export async function GET(req: NextRequest) {
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
    orderBy: { releaseDate: 'desc' },
    select: { id: true, name: true, series: true, externalId: true, releaseDate: true },
  })

  // 依 series 分組，groups 本身依 latestRelease 由新到舊排序
  const groupMap = new Map<string, SetGroup>()
  for (const set of sets) {
    if (!groupMap.has(set.series)) {
      groupMap.set(set.series, {
        series: set.series,
        latestRelease: set.releaseDate?.toISOString() ?? null,
        sets: [],
      })
    }
    groupMap.get(set.series)!.sets.push({
      id: set.id,
      name: set.name,
      series: set.series,
      externalId: set.externalId,
      releaseDate: set.releaseDate?.toISOString() ?? null,
    })
  }

  const groups = Array.from(groupMap.values()).sort((a, b) => {
    if (!a.latestRelease) return 1
    if (!b.latestRelease) return -1
    return new Date(b.latestRelease).getTime() - new Date(a.latestRelease).getTime()
  })

  return Response.json({ groups })
}
