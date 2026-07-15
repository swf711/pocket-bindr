/**
 * 判斷是否為「應擋的外站 hotlink」。缺 Referer/Origin 一律放行（fail-open）——
 * Googlebot 抓 /api/proxy-image 圖（見 CLAUDE.md B1 決策）常不帶 Referer，若一併擋掉會打臉該 SEO 目標；
 * 只在能正向確認來源 origin ≠ siteOrigin 時才視為外站 hotlink。來源字串解析失敗同樣 fail-open。
 */
export function isCrossOriginHotlink(referer: string | null, origin: string | null, siteOrigin: string): boolean {
  const source = origin ?? referer
  if (!source) return false
  try {
    return new URL(source).origin !== siteOrigin
  } catch {
    return false
  }
}
