import { SetGroup } from '@/types/card'

/** /api/sets 排序用的最小卡冊形狀（releaseDate 可為 Date 或 ISO 字串） */
export interface RawSetForSort {
  id: string
  name: string
  series: string
  externalId: string
  releaseDate: Date | string | null
}

function toIso(d: Date | string | null): string | null {
  if (d === null) return null
  return d instanceof Date ? d.toISOString() : d
}

/** 跨語言促銷卡名關鍵字；已對現有資料稽核無誤中（EN 僅 Black Star Promos、JA 僅プロモ、ZH_TW 僅特典卡） */
export const PROMO_NAME_PATTERN = /プロモ|特典|promo/i

export function isPromoSet(name: string): boolean {
  return PROMO_NAME_PATTERN.test(name)
}

/**
 * 同 series group 內排序：
 * - 促銷卡（名稱含 プロモ／特典／promo）一律釘在該組最後，不論日期
 * - 非促銷 set 依 releaseDate 由新到舊；null 排在有日期者之後
 * - 同一發售日（或皆為 null）之間以 externalId 降冪遞補
 */
export function sortSetsWithinGroup<
  T extends { name: string; externalId: string; releaseDate: Date | string | null }
>(sets: T[]): T[] {
  return [...sets].sort((a, b) => {
    const pa = isPromoSet(a.name) ? 1 : 0
    const pb = isPromoSet(b.name) ? 1 : 0
    if (pa !== pb) return pa - pb

    const da = toIso(a.releaseDate)
    const db = toIso(b.releaseDate)
    if (da && db) {
      const diff = new Date(db).getTime() - new Date(da).getTime()
      if (diff !== 0) return diff
      // 同一發售日 → externalId 降冪
      return b.externalId.localeCompare(a.externalId)
    }
    if (da && !db) return -1
    if (!da && db) return 1
    // 皆為 null → externalId 降冪
    return b.externalId.localeCompare(a.externalId)
  })
}

/**
 * 將卡冊依 series 分組並排序：
 * - 組內 sets 用 sortSetsWithinGroup
 * - latestRelease = 組內最新有效 releaseDate（皆無則 null）
 * - group 間依 latestRelease 由新到舊；null 排最後
 */
export function groupAndSortSets(sets: RawSetForSort[]): SetGroup[] {
  const groupMap = new Map<string, RawSetForSort[]>()
  for (const set of sets) {
    if (!groupMap.has(set.series)) groupMap.set(set.series, [])
    groupMap.get(set.series)!.push(set)
  }

  const groups: SetGroup[] = Array.from(groupMap.entries()).map(([series, rawSets]) => {
    const sorted = sortSetsWithinGroup(rawSets)
    const latestRelease =
      sorted.map(s => toIso(s.releaseDate)).find(d => d !== null) ?? null
    return {
      series,
      latestRelease,
      sets: sorted.map(s => ({
        id: s.id,
        name: s.name,
        series: s.series,
        externalId: s.externalId,
        releaseDate: toIso(s.releaseDate),
      })),
    }
  })

  return groups.sort((a, b) => {
    if (!a.latestRelease && !b.latestRelease) return 0
    if (!a.latestRelease) return 1
    if (!b.latestRelease) return -1
    return new Date(b.latestRelease).getTime() - new Date(a.latestRelease).getTime()
  })
}
