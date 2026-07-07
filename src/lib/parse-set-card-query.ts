import { Prisma, type Game, type Language } from '@prisma/client'
import { resolvePtcgSetCodeCandidates } from './ptcg-set-code-aliases'

// 卡號成分：斜線形（JA/ZH_TW 卡面印刷，numerator ≤3 位）優先，否則裸號（≤4 位，EN 常見）
const NUM_COMPONENT_SRC = '(?:\\d{1,3}\\/[A-Za-z0-9-]{1,8}|\\d{1,4})'
const SET_CARD_HYPHEN = new RegExp(`^([A-Za-z][A-Za-z0-9]*)-(${NUM_COMPONENT_SRC})$`)
const SET_CARD_SPACE = new RegExp(`^([A-Za-z][A-Za-z0-9]*)\\s+(${NUM_COMPONENT_SRC})$`)
// 純 set code：字母開頭、含至少一位數字（排除 "pikachu" 等純文字卡名）
const SET_ONLY_PATTERN = /^([A-Za-z][A-Za-z0-9]*\d[A-Za-z0-9]*)$/
const SLASH_ONLY_PATTERN = /^(\d{1,3}\/[A-Za-z0-9-]{1,8})$/
const SLASH_COMPONENT = /^(\d{1,3})\/([A-Za-z0-9-]{1,8})$/
const PLAIN_NUM = /^\d{1,4}$/

export interface ParsedSetCardQuery {
  setCode: string | null    // null = 無 set code 成分（斜線單獨形）
  num: string | null        // 前導數字（保留前導零）；null = set-only
  fullSlash: string | null  // 斜線來源時的原始 NUM/TOTAL（如 "036/190"），供 JA/ZH_TW 精確比對
}

/**
 * 印刷形數字成分 → 查詢用正規化，卡號查詢解析的單一真相。
 * 斜線形（`036/190`）→ 保留分子（前導零）+ 完整字串（供 JA/ZH_TW 精確比對）；
 * 裸號（`36`、`036`）→ 直接沿用，無 fullSlash（EN 一般形態）。
 */
export function normalizeNumComponent(
  raw: string,
): { num: string; strippedNum: string; fullSlash: string | null } | null {
  const trimmed = raw.trim()

  const slashMatch = trimmed.match(SLASH_COMPONENT)
  if (slashMatch) {
    const numerator = slashMatch[1]
    return { num: numerator, strippedNum: String(parseInt(numerator, 10)), fullSlash: trimmed }
  }

  if (PLAIN_NUM.test(trimmed)) {
    return { num: trimmed, strippedNum: String(parseInt(trimmed, 10)), fullSlash: null }
  }

  return null
}

/**
 * 型號查詢一般化解析：分隔符（空格/連字號）無關 + 斜線容忍。
 * 支援：SETCODE-NUM｜SETCODE NUM｜SETCODE NUM/TOTAL｜SETCODE-NUM/TOTAL｜NUM/TOTAL｜SETCODE
 */
export function parseSetCardQuery(q: string): ParsedSetCardQuery | null {
  const trimmed = q.trim().replace(/\s+/g, ' ')
  if (!trimmed) return null

  const slashOnly = trimmed.match(SLASH_ONLY_PATTERN)
  if (slashOnly) {
    const comp = normalizeNumComponent(slashOnly[1])
    if (comp) return { setCode: null, num: comp.num, fullSlash: comp.fullSlash }
  }

  const hyphenMatch = trimmed.match(SET_CARD_HYPHEN)
  if (hyphenMatch) {
    const comp = normalizeNumComponent(hyphenMatch[2])
    if (comp) return { setCode: hyphenMatch[1].toLowerCase(), num: comp.num, fullSlash: comp.fullSlash }
  }

  const spaceMatch = trimmed.match(SET_CARD_SPACE)
  if (spaceMatch) {
    const comp = normalizeNumComponent(spaceMatch[2])
    if (comp) return { setCode: spaceMatch[1].toLowerCase(), num: comp.num, fullSlash: comp.fullSlash }
  }

  const setOnlyMatch = trimmed.match(SET_ONLY_PATTERN)
  if (setOnlyMatch) return { setCode: setOnlyMatch[1].toLowerCase(), num: null, fullSlash: null }
  // 註：卡面碼 → DB externalId 的語言相依解析（ZH_TW 剝尾 F、EN ptcgoCode）刻意不在此做，
  // 放在 buildSetCard* 收 language 後展開候選碼，保持 parseSetCardQuery 語言無關。

  return null
}

export function buildSetCardPrismaWhere(
  parsed: ParsedSetCardQuery,
  game?: Game | null,
  language?: Language | null,
): Prisma.CardWhereInput {
  // setCode 展開為 DB externalId 候選（PTCG ZH_TW 剝尾 F、EN ptcgoCode；其餘原碼）
  const setCandidates =
    parsed.setCode !== null ? resolvePtcgSetCodeCandidates(parsed.setCode, game, language) : []
  const setFilter: Prisma.CardWhereInput =
    setCandidates.length === 0
      ? {}
      : setCandidates.length === 1
        ? { set: { externalId: { equals: setCandidates[0], mode: 'insensitive' as const } } }
        : {
            set: {
              OR: setCandidates.map(c => ({ externalId: { equals: c, mode: 'insensitive' as const } })),
            },
          }

  if (parsed.num === null && parsed.fullSlash === null) {
    return setFilter
  }

  const orParts: Prisma.CardWhereInput[] = []
  if (parsed.num !== null) {
    const strippedNum = String(parseInt(parsed.num, 10))
    orParts.push({ cardNumber: { equals: parsed.num } })
    orParts.push({ cardNumber: { equals: strippedNum } })
    // startsWith 分子廣撈只在「裸號查詢」（無 fullSlash）時做；使用者已給完整斜線值時，
    // 廣撈會把 036/190 誤撈成 036/081 等（實測 200+ 筆），改由下方 fullSlash 精確比對即可。
    if (parsed.fullSlash === null) {
      orParts.push({ cardNumber: { startsWith: parsed.num, mode: 'insensitive' as const } })
      if (parsed.setCode !== null) {
        orParts.push({ cardNumber: { startsWith: `${parsed.setCode}-${parsed.num}`, mode: 'insensitive' as const } })
      }
    }
  }
  if (parsed.fullSlash !== null) {
    orParts.push({ cardNumber: { equals: parsed.fullSlash, mode: 'insensitive' as const } })
  }

  return { ...setFilter, OR: orParts }
}

export function buildSetCardSql(
  parsed: ParsedSetCardQuery,
  game?: Game | null,
  language?: Language | null,
): Prisma.Sql {
  const setCandidates =
    parsed.setCode !== null ? resolvePtcgSetCodeCandidates(parsed.setCode, game, language) : []
  const setClause =
    setCandidates.length > 0
      ? Prisma.sql`EXISTS (
    SELECT 1 FROM "CardSet" cs
    WHERE cs.id = "Card"."setId"
      AND (${Prisma.join(
        setCandidates.map(c => Prisma.sql`cs."externalId" ILIKE ${c}`),
        ' OR ',
      )})
  )`
      : null

  if (parsed.num === null && parsed.fullSlash === null) {
    return setClause ? Prisma.sql`(${setClause})` : Prisma.sql`TRUE`
  }

  const numParts: Prisma.Sql[] = []
  if (parsed.num !== null) {
    const strippedNum = String(parseInt(parsed.num, 10))
    numParts.push(Prisma.sql`"cardNumber" = ${parsed.num}`)
    numParts.push(Prisma.sql`"cardNumber" = ${strippedNum}`)
    // startsWith 分子廣撈只在「裸號查詢」（無 fullSlash）時做；完整斜線值改由下方精確比對，
    // 避免 036/190 廣撈成 036/081 等（實測 200+ 筆）。
    if (parsed.fullSlash === null) {
      numParts.push(Prisma.sql`"cardNumber" ILIKE ${parsed.num + '%'}`)
      if (parsed.setCode !== null) {
        numParts.push(Prisma.sql`"cardNumber" ILIKE ${parsed.setCode + '-' + parsed.num + '%'}`)
      }
    }
  }
  if (parsed.fullSlash !== null) {
    numParts.push(Prisma.sql`"cardNumber" ILIKE ${parsed.fullSlash}`)
  }

  const numClause = Prisma.sql`(${Prisma.join(numParts, ' OR ')})`

  return setClause ? Prisma.sql`(${setClause} AND ${numClause})` : Prisma.sql`(${numClause})`
}
