export const PROXY_HOSTNAMES = [
  'asia-tc.onepiece-cardgame.com',
  'www.onepiece-cardgame.com',
  'asia.pokemon-card.com',
  'www.pokemon-card.com',
]

export function getCardImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    return url
  }
  if (PROXY_HOSTNAMES.includes(hostname)) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`
  }
  return url
}
