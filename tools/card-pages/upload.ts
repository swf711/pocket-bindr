import type { S3Client } from '@aws-sdk/client-s3'
import { putObject } from './r2'

const UPLOAD_CONTENT_TYPE: Record<string, string> = {
  'robots.txt': 'text/plain; charset=utf-8',
  'sitemap.xml': 'application/xml',
}

export function contentTypeFor(key: string): string {
  return (
    UPLOAD_CONTENT_TYPE[key]
    ?? (key.endsWith('.xml') ? 'application/xml' : key.endsWith('.svg') ? 'image/svg+xml' : 'text/html; charset=utf-8')
  )
}

/**
 * 併發上傳（固定批次大小），取代逐一序列 PUT。
 *
 * 🔴 78,743 個物件若逐一序列等待，單次 round-trip 抓 100–300ms 估算總耗時可達 2–6 小時，
 * 遠超 GitHub Actions job 的 30 分鐘上限（2026-09-28 首次 apply 實測命中此上限、job 被強制
 * 取消，此為修正）。改批次併發後每批同時打 `UPLOAD_CONCURRENCY` 個請求，理論上可依併發數
 * 近似線性加速（瓶頸是網路 round-trip，非本地 CPU）。批次間仍序列執行，避免瞬間開太多連線
 * 觸發 R2 的節流。
 */
const UPLOAD_CONCURRENCY = 50

export async function uploadAll(
  client: S3Client,
  bucket: string,
  keys: readonly string[],
  local: Map<string, string>,
): Promise<void> {
  for (let i = 0; i < keys.length; i += UPLOAD_CONCURRENCY) {
    const batch = keys.slice(i, i + UPLOAD_CONCURRENCY)
    await Promise.all(
      batch.map(key => putObject(client, bucket, key, local.get(key)!, contentTypeFor(key))),
    )
    if ((i / UPLOAD_CONCURRENCY) % 20 === 0) {
      console.log(`[card-pages] 上傳進度：${Math.min(i + UPLOAD_CONCURRENCY, keys.length)}/${keys.length}`)
    }
  }
}
