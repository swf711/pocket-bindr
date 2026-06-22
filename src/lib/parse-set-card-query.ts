import { Prisma } from '@prisma/client'

const SET_CARD_PATTERN = /^([A-Za-z][A-Za-z0-9]*)-(\d{1,4})$/

export interface ParsedSetCardQuery {
  setCode: string
  num: string
}

export function parseSetCardQuery(q: string): ParsedSetCardQuery | null {
  const m = q.match(SET_CARD_PATTERN)
  if (!m) return null
  return { setCode: m[1].toLowerCase(), num: m[2] }
}

export function buildSetCardPrismaWhere(parsed: ParsedSetCardQuery): Prisma.CardWhereInput {
  const strippedNum = String(parseInt(parsed.num, 10))
  return {
    set: { externalId: { equals: parsed.setCode, mode: 'insensitive' } },
    OR: [
      { cardNumber: { equals: parsed.num } },
      { cardNumber: { equals: strippedNum } },
      { cardNumber: { startsWith: parsed.num + '/' } },
      { cardNumber: { endsWith: '-' + parsed.num } },
    ],
  }
}

export function buildSetCardSql(parsed: ParsedSetCardQuery): Prisma.Sql {
  const strippedNum = String(parseInt(parsed.num, 10))
  return Prisma.sql`(
    EXISTS (
      SELECT 1 FROM "CardSet" cs
      WHERE cs.id = "Card"."setId"
        AND cs."externalId" ILIKE ${parsed.setCode}
    )
    AND (
      "cardNumber" = ${parsed.num}
      OR "cardNumber" = ${strippedNum}
      OR "cardNumber" LIKE ${parsed.num + '/%'}
      OR "cardNumber" LIKE ${'%-' + parsed.num}
    )
  )`
}
