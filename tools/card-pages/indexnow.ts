/**
 * IndexNow submission for the card-pages subdomain (supported by Bing/Yandex; Google ignores it).
 *
 * The key file lives at the subdomain root (`{key}.txt`, uploaded alongside the pages so the diff
 * sync never treats it as an orphan). Submission is fail-open: a rejected or failed request only
 * logs a warning and never fails the workflow, since the pages themselves are already published.
 */

export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'
/** Protocol limit per request. */
export const INDEXNOW_BATCH_SIZE = 10_000

export type IndexNowMode = 'changed' | 'all' | 'off'

export interface IndexNowPayload {
  host: string
  key: string
  keyLocation: string
  urlList: string[]
}

export function parseIndexNowMode(argv: readonly string[]): IndexNowMode {
  const flag = argv.find(arg => arg.startsWith('--indexnow='))
  const value = flag?.slice('--indexnow='.length) ?? 'changed'
  if (value === 'changed' || value === 'all' || value === 'off') return value
  throw new Error(`--indexnow 只接受 changed / all / off，收到：${value}`)
}

/** Protocol: 8–128 characters of a–z, A–Z, 0–9 and dashes. */
export function isValidIndexNowKey(key: string): boolean {
  return /^[A-Za-z0-9-]{8,128}$/.test(key)
}

export function indexNowKeyObjectKey(key: string): string {
  return `${key}.txt`
}

export function buildIndexNowPayloads(origin: string, key: string, urls: readonly string[]): IndexNowPayload[] {
  const host = new URL(origin).host
  const keyLocation = `${origin}/${indexNowKeyObjectKey(key)}`
  const payloads: IndexNowPayload[] = []
  for (let i = 0; i < urls.length; i += INDEXNOW_BATCH_SIZE) {
    payloads.push({ host, key, keyLocation, urlList: urls.slice(i, i + INDEXNOW_BATCH_SIZE) })
  }
  return payloads
}

/** Never throws. Returns how many URLs were accepted (2xx) and how many were not. */
export async function submitIndexNow(
  payloads: readonly IndexNowPayload[],
  fetchImpl: typeof fetch = fetch,
): Promise<{ submitted: number; failed: number }> {
  let submitted = 0
  let failed = 0
  for (const payload of payloads) {
    try {
      const res = await fetchImpl(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        submitted += payload.urlList.length
      } else {
        failed += payload.urlList.length
        console.warn(`[indexnow] batch rejected: HTTP ${res.status}`)
      }
    } catch (err) {
      failed += payload.urlList.length
      console.warn('[indexnow] batch failed:', err instanceof Error ? err.message : 'unknown error')
    }
  }
  return { submitted, failed }
}
