import { config } from 'dotenv'
// 對齊 Next.js / db.ts 的 env 精度：先 .env 再 .env.local（override）。
config({ path: '.env' })
config({ path: '.env.local', override: true })
import { readFileSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

/**
 * 見 seed-users.ts 同名函式註解：保留原始 DATABASE_URL（含 pgbouncer 參數），
 * 避免 src/lib/prisma 的 strip + force ssl 組合在寫入時偶發 TLS 錯誤。
 */
function makePrisma(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

interface FixtureCardSet {
  id: string
  name: string
  series: string
  totalCards: number
  releaseDate: string | null
  symbolUrl: string | null
  game: string
  language: string
  externalId: string
  syncedAt: string
}

interface FixtureCard {
  id: string
  externalId: string
  language: string
  game: string
  name: string
  supertype: string
  subtypes: string[]
  hp: number | null
  types: string[]
  setId: string
  cardNumber: string
  rarity: string | null
  imageSmall: string
  imageLarge: string
  syncedAt: string
  attributes: unknown
  isCollectible: boolean
  canonicalCardId: string | null
}

/**
 * 從 e2e/fixtures/card-seed.json（committed，由 scripts/gen-e2e-card-seed.ts 從 DEV 匯出）
 * 冪等灌入精選卡牌子集，供 CI fresh Postgres 使用。CardSet 先、非 alias Card 次、alias Card
 * 最後（canonicalCardId FK 依賴非 alias Card 已存在）。
 * 回傳實際處理的 CardSet / Card 數。
 */
export async function seedCardData(): Promise<{ sets: number; cards: number }> {
  const fixturePath = join(process.cwd(), 'e2e', 'fixtures', 'card-seed.json')
  const raw = JSON.parse(readFileSync(fixturePath, 'utf8')) as {
    cardSets: FixtureCardSet[]
    cards: FixtureCard[]
  }

  const prisma = makePrisma()
  try {
    for (const s of raw.cardSets) {
      await prisma.cardSet.upsert({
        where: { id: s.id },
        create: {
          id: s.id,
          name: s.name,
          series: s.series,
          totalCards: s.totalCards,
          releaseDate: s.releaseDate ? new Date(s.releaseDate) : null,
          symbolUrl: s.symbolUrl,
          game: s.game as never,
          language: s.language as never,
          externalId: s.externalId,
          syncedAt: new Date(s.syncedAt),
        },
        update: {},
      })
    }

    // 非 alias 先、alias 後：canonicalCardId 指向的 Card 必須先存在。
    const nonAliasCards = raw.cards.filter((c) => !c.canonicalCardId)
    const aliasCards = raw.cards.filter((c) => c.canonicalCardId)

    for (const batch of [nonAliasCards, aliasCards]) {
      for (const c of batch) {
        await prisma.card.upsert({
          where: { id: c.id },
          create: {
            id: c.id,
            externalId: c.externalId,
            language: c.language as never,
            game: c.game as never,
            name: c.name,
            supertype: c.supertype,
            subtypes: c.subtypes,
            hp: c.hp,
            types: c.types,
            setId: c.setId,
            cardNumber: c.cardNumber,
            rarity: c.rarity,
            imageSmall: c.imageSmall,
            imageLarge: c.imageLarge,
            syncedAt: new Date(c.syncedAt),
            attributes: c.attributes as never,
            isCollectible: c.isCollectible,
            canonicalCardId: c.canonicalCardId,
          },
          update: {},
        })
      }
    }

    return { sets: raw.cardSets.length, cards: raw.cards.length }
  } finally {
    await prisma.$disconnect()
  }
}
