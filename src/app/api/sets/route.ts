import { unstable_cache } from 'next/cache'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Game, Language } from '@prisma/client'
import { groupAndSortSets } from '@/lib/sort-card-sets'
import { cardsReadIpLimiter, getClientIp } from '@/lib/rate-limit'

/** 公開快取：回應只依 game/language 決定，與使用者無關；s-maxage 對齊內層 unstable_cache 的 revalidate。 */
export const SETS_CACHE_CONTROL = 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'

// 每個 (game, language) 組合各自快取——此端點先前完全沒有 unstable_cache，每次請求都直接打 DB
// （2026-09-29 Observability 實測平均 ~303ms/次）。revalidate 1 小時：爬蟲新增系列後最長 1 小時
// 才反映在下拉選單，可接受（可手動 revalidateTag('sets') 但不在本輪範圍）。
const fetchSetGroups = (game: Game, language: Language) =>
  unstable_cache(
    async () => {
      const sets = await prisma.cardSet.findMany({
        where: { game, language },
        select: { id: true, name: true, series: true, externalId: true, releaseDate: true },
      })
      // 依 series 分組 + 排序（組內 releaseDate desc，null 以 externalId 降冪遞補；組間依 latestRelease desc）
      return groupAndSortSets(sets)
    },
    ['sets', game, language],
    { revalidate: 3600, tags: ['sets'] },
  )()

export async function GET(req: NextRequest) {
  const { success } = await cardsReadIpLimiter.limit(getClientIp(req))
  if (!success) {
    return Response.json({ error: 'RATE_LIMITED' }, { status: 429, headers: { 'Cache-Control': 'no-store' } })
  }

  const game = req.nextUrl.searchParams.get('game')
  if (!game || !Object.values(Game).includes(game as Game)) {
    return Response.json({ error: 'game is required' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  const rawLang = req.nextUrl.searchParams.get('language')
  const language: Language =
    rawLang && Object.values(Language).includes(rawLang as Language)
      ? (rawLang as Language)
      : 'EN'

  const groups = await fetchSetGroups(game as Game, language)

  return Response.json({ groups }, { headers: { 'Cache-Control': SETS_CACHE_CONTROL } })
}
