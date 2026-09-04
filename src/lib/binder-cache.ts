import { revalidateTag } from 'next/cache'

export function publicBinderTag(shareToken: string): string {
  return `binder-public:${shareToken}`
}

// No-op when binder has no shareToken (not publicly shared).
//
// 🔴 Next.js 16 的 revalidateTag 第二個參數不只是型別要求，它決定失效強度：
// 傳 `{}`（沒有 expire）只會把 tag 排進 stale-while-revalidate，快取條目不會立刻作廢，
// 公開分享頁在 unstable_cache 的 revalidate 300 到期前仍會端出舊資料（E2E 實測：
// 擁有者改完後訪客重新整理仍看到舊值）。`{ expire: 0 }` 才是「立即失效」。
export function revalidatePublicBinder(shareToken: string | null | undefined): void {
  if (shareToken) revalidateTag(publicBinderTag(shareToken), { expire: 0 })
}
