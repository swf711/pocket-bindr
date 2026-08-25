import type { PtcgApiSet, PtcgApiCard, PtcgApiResponse } from '@/types/ptcg'

const BASE_URL = 'https://api.pokemontcg.io/v2'
const PAGE_SIZE = 250

/** 單頁請求逾時（ms）。上游偶發連線層失敗（curl 實測見過連線直接斷），非只有 HTTP 5xx，
 *  故 timeout 與網路錯誤都必須納入重試條件。 */
export const PTCG_FETCH_TIMEOUT_MS = 15000

/** 單頁請求失敗後的重試次數（總嘗試數 = 1 + retries）。
 *  2026-08 實測上游進入間歇性 5xx 狀態，單發成功率一度僅約 35%——零重試的寫法會把
 *  「上游抖動」放大成「必定失敗」（單發沒中即整批 throw）。7 次重試（8 次嘗試）在該
 *  成功率下把殘餘失敗率壓到約 3%。
 *  本模組的消費端皆為離線批次維護工具（非使用者請求路徑），最壞多等約 30 秒無妨，
 *  故偏好重試次數而非低延遲。 */
export const PTCG_FETCH_RETRIES = 7

/** 指數退避基數與上限（ms）：第 n 次重試前等待 min(base × 2^(n-1), max) + jitter。
 *  退避是為了在上游過載時不加劇壓力；設上限避免次數提高後尾端等待無限翻倍。 */
export const PTCG_RETRY_BASE_DELAY_MS = 500
export const PTCG_RETRY_MAX_DELAY_MS = 8000

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** 可重試的 HTTP 狀態：5xx（上游異常）與 429（限流）。其餘 4xx 屬永久錯誤，重試無意義。 */
function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 429
}

/**
 * 單頁請求 + 逾時 + 重試。失敗（含逾時／網路錯誤／可重試狀態碼）時指數退避後重試，
 * 次數用盡仍失敗則 throw。
 *
 * ⚠️ 錯誤訊息維持既有 `API error: ${status}` 格式，消費端的錯誤處理依賴此契約。
 */
async function fetchPageWithRetry(url: string): Promise<Response> {
  let lastError: Error = new Error('API error: unknown')

  for (let attempt = 0; attempt <= PTCG_FETCH_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoff = Math.min(PTCG_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1), PTCG_RETRY_MAX_DELAY_MS)
      await sleep(backoff + Math.random() * PTCG_RETRY_BASE_DELAY_MS)
    }

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(PTCG_FETCH_TIMEOUT_MS) })
      if (res.ok) return res
      // 永久錯誤（4xx，429 除外）立即放棄，不耗用剩餘 attempt
      if (!isRetryableStatus(res.status)) throw new Error(`API error: ${res.status}`)
      lastError = new Error(`API error: ${res.status}`)
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('API error: ')) throw err
      lastError = err instanceof Error ? err : new Error(String(err))
    }
  }

  throw lastError
}

async function fetchAllPages<T>(url: string): Promise<T[]> {
  const all: T[] = []
  let page = 1

  while (true) {
    const separator = url.includes('?') ? '&' : '?'
    const res = await fetchPageWithRetry(`${url}${separator}page=${page}&pageSize=${PAGE_SIZE}`)

    const json: PtcgApiResponse<T> = await res.json()
    all.push(...json.data)

    if (all.length >= json.totalCount) break
    page++
  }

  return all
}

export async function fetchSets(): Promise<PtcgApiSet[]> {
  return fetchAllPages<PtcgApiSet>(`${BASE_URL}/sets`)
}

export async function fetchCardsBySet(setId: string): Promise<PtcgApiCard[]> {
  return fetchAllPages<PtcgApiCard>(`${BASE_URL}/cards?q=${encodeURIComponent(`set.id:${setId}`)}`)
}
