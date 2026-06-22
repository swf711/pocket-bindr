import { Prisma } from '@prisma/client'

const SET_CARD_PATTERN = /^([A-Za-z][A-Za-z0-9]*)-(\d{1,4})$/
// 純 set code：字母開頭、含至少一位數字（排除 "pikachu" 等純文字卡名）
const SET_ONLY_PATTERN = /^([A-Za-z][A-Za-z0-9]*\d[A-Za-z0-9]*)$/

export interface ParsedSetCardQuery {
  setCode: string
  num: string | null  // null = set-only 搜尋，不過濾卡號
}

export function parseSetCardQuery(q: string): ParsedSetCardQuery | null {
  const m = q.match(SET_CARD_PATTERN)
  if (m) return { setCode: m[1].toLowerCase(), num: m[2] }

  const m2 = q.match(SET_ONLY_PATTERN)
  if (m2) return { setCode: m2[1].toLowerCase(), num: null }

  return null
}

export function buildSetCardPrismaWhere(parsed: ParsedSetCardQuery): Prisma.CardWhereInput {
  const setFilter = { externalId: { equals: parsed.setCode, mode: 'insensitive' as const } }

  if (parsed.num === null) {
    return { set: setFilter }
  }

  const { num, setCode } = parsed
  const strippedNum = String(parseInt(num, 10))
  return {
    set: setFilter,
    OR: [
      { cardNumber: { equals: num } },
      { cardNumber: { equals: strippedNum } },
      { cardNumber: { startsWith: num, mode: 'insensitive' as const } },
      { cardNumber: { startsWith: setCode + '-' + num, mode: 'insensitive' as const } },
    ],
  }
}

export function buildSetCardSql(parsed: ParsedSetCardQuery): Prisma.Sql {
  const existsClause = Prisma.sql`EXISTS (
    SELECT 1 FROM "CardSet" cs
    WHERE cs.id = "Card"."setId"
      AND cs."externalId" ILIKE ${parsed.setCode}
  )`

  if (parsed.num === null) {
    return Prisma.sql`(${existsClause})`
  }

  const { num, setCode } = parsed
  const strippedNum = String(parseInt(num, 10))
  return Prisma.sql`(
    ${existsClause}
    AND (
      "cardNumber" = ${num}
      OR "cardNumber" = ${strippedNum}
      OR "cardNumber" ILIKE ${num + '%'}
      OR "cardNumber" ILIKE ${setCode + '-' + num + '%'}
    )
  )`
}
