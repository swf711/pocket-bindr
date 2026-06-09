export interface PtcgApiSet {
  id: string
  name: string
  series: string
  printedTotal: number
  total: number
  releaseDate: string
  images: {
    symbol: string
    logo: string
  }
}

export interface PtcgApiCard {
  id: string
  name: string
  supertype: string
  subtypes?: string[]
  hp?: string
  types?: string[]
  set: { id: string }
  number: string
  rarity?: string
  images: {
    small: string
    large: string
  }
}

export interface PtcgApiResponse<T> {
  data: T[]
  page: number
  pageSize: number
  count: number
  totalCount: number
}
