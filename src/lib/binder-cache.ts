import { revalidateTag } from 'next/cache'

export function publicBinderTag(shareToken: string): string {
  return `binder-public:${shareToken}`
}

// No-op when binder has no shareToken (not publicly shared).
// Next.js 16 revalidateTag requires a second profile argument (empty CacheLifeConfig).
export function revalidatePublicBinder(shareToken: string | null | undefined): void {
  if (shareToken) revalidateTag(publicBinderTag(shareToken), {})
}
