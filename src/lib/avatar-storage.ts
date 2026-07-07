/**
 * server-only：以純 REST 操作 Supabase Storage 的 `avatars` bucket。
 * 與 scripts/lib/supabase-storage.ts 同款實作（純 REST + SERVICE_ROLE_KEY），
 * 但獨立於 scripts/，因為這支會被 runtime API route import 進 server bundle——
 * scripts/ 之下的模組刻意只給本機腳本用，不應被 app 程式碼 import。
 * SERVICE_ROLE_KEY 為高權限金鑰，只在 server 端讀取，勿進前端 bundle。
 */

const AVATAR_BUCKET = 'avatars'

function requireEnv(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('缺少 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY（請填 .env，見 .env.example）')
  }
  return { url: url.replace(/\/$/, ''), key }
}

export async function ensureAvatarBucket(): Promise<void> {
  const { url, key } = requireEnv()
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      apikey: key,
    },
    body: JSON.stringify({ id: AVATAR_BUCKET, name: AVATAR_BUCKET, public: true }),
  })
  if (res.ok) return
  const text = await res.text()
  if (res.status === 400 && /already exists|Duplicate/i.test(text)) return
  if (res.status === 409) return
  throw new Error(`建立 avatars bucket 失敗：HTTP ${res.status} ${text}`)
}

export async function uploadAvatar(
  userId: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const { url, key } = requireEnv()
  const path = `${userId}.webp`
  const res = await fetch(`${url}/storage/v1/object/${AVATAR_BUCKET}/${encodeURIComponent(path)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      'Content-Type': contentType,
      'x-upsert': 'true',
      'cache-control': 'public, max-age=31536000',
    },
    body: body as unknown as BodyInit,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`上傳頭像失敗：HTTP ${res.status} ${text}`)
  }
  // 固定路徑 upsert，公開 URL 需帶 cache-bust query 避免瀏覽器/CDN 快取舊圖。
  return `${url}/storage/v1/object/public/${AVATAR_BUCKET}/${encodeURIComponent(path)}?v=${Date.now()}`
}

export async function deleteAvatar(userId: string): Promise<void> {
  const { url, key } = requireEnv()
  const path = `${userId}.webp`
  await fetch(`${url}/storage/v1/object/${AVATAR_BUCKET}/${encodeURIComponent(path)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
    },
  }).catch(() => {})
}
