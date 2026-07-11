import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { publicBinderTag } from '@/lib/binder-cache'
import { slotDisplaySelect } from '@/lib/slot-display'

/**
 * 依 shareToken 取公開卡冊（含 user 顯示名與已填格位）。
 * `unstable_cache`（revalidate 300、tag 化）——同一 token 於 page / generateMetadata /
 * opengraph-image 三處呼叫共用同一 cache entry，不重複打 DB。
 */
export function fetchPublicBinder(token: string) {
  return unstable_cache(
    () =>
      prisma.binder.findUnique({
        where: { shareToken: token },
        include: {
          user: { select: { username: true } },
          slots: {
            where: { cardId: { not: null } },
            orderBy: [{ pageNumber: 'asc' }, { slotIndex: 'asc' }],
            select: slotDisplaySelect,
          },
        },
      }),
    ['binder-public', token],
    { revalidate: 300, tags: [publicBinderTag(token)] },
  )()
}

export type PublicBinderRow = NonNullable<Awaited<ReturnType<typeof fetchPublicBinder>>>
