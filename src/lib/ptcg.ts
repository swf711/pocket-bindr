import type { PtcgApiSet, PtcgApiCard, PtcgApiResponse } from '@/types/ptcg'

const BASE_URL = 'https://api.pokemontcg.io/v2'
const PAGE_SIZE = 250

function headers() {
  return { 'X-Api-Key': process.env.PTCG_API_KEY ?? '' }
}

async function fetchAllPages<T>(url: string): Promise<T[]> {
  const all: T[] = []
  let page = 1

  while (true) {
    const separator = url.includes('?') ? '&' : '?'
    const res = await fetch(`${url}${separator}page=${page}&pageSize=${PAGE_SIZE}`, {
      headers: headers(),
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)

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
