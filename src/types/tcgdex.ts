export interface TcgdexSet {
  id: string
  name: string
  serie: { id: string; name: string }
  releaseDate?: string
  symbol?: string
  logo?: string
  cards: TcgdexCardBrief[]
}

export interface TcgdexCardBrief {
  id: string
  localId: string
  name: string
  image?: string
}
