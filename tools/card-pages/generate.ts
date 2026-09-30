import 'dotenv/config'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { CARD_UI_LOCALE } from '@/lib/card-url'
import { buildCardBreadcrumbItems, buildCardJsonLd } from '@/lib/card-jsonld'
import { CARD_NUMBER_ORDER_SQL, cardPublicInclude } from '@/lib/public-card-queries'
import type { PublicCardRow, SameSetCardRow } from '@/lib/public-card-queries'
import { getTranslations } from './messages'
import { renderCardPage } from './render'
import { extractThemeTokens } from './css'
import { objectKeyFor, planSync, assertSafeRemoval } from './sync'
import { createR2Client, listRemoteObjects, md5Hex, deleteObjects } from './r2'
import { uploadAll } from './upload'
import {
  cardPageUrl,
  buildSubdomainRobotsTxt,
  buildSubdomainSitemapIndex,
  buildSubdomainUrlSet,
} from './seo'
import {
  parseIndexNowMode,
  isValidIndexNowKey,
  indexNowKeyObjectKey,
  buildIndexNowPayloads,
  submitIndexNow,
} from './indexnow'

const SAME_SET_FETCH_LIMIT = 7
const SAME_SET_DISPLAY_LIMIT = 6
const SITEMAP_CHUNK_SIZE = 20_000

const CARD_PAGES_ORIGIN = process.env.NEXT_PUBLIC_CARD_PAGES_ORIGIN
if (!CARD_PAGES_ORIGIN) {
  throw new Error(
    '產生器必須在 NEXT_PUBLIC_CARD_PAGES_ORIGIN 已設定的情況下執行（子網域總開關），' +
      '否則產出的 canonical/連結會是錯的。',
  )
}

const APPLY = process.argv.includes('--apply')
const INDEXNOW_MODE = parseIndexNowMode(process.argv)
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || undefined
if (INDEXNOW_KEY && !isValidIndexNowKey(INDEXNOW_KEY)) {
  throw new Error('INDEXNOW_KEY 格式不符（須為 8–128 個英數字或 -）')
}
const PREVIEW_DIR = join(process.cwd(), 'tools/card-pages/.preview')
const PREVIEW_SAMPLE_SIZE = 8

/** 每個系列的前 7 張（依 CARD_NUMBER_ORDER_SQL 排序）id，供「同系列其他卡」批次取用，
 *  避免對 78k 張卡逐張各查一次（見 tools/card-pages/README.md「批次策略」）。 */
async function fetchTopSevenIdsBySet(setIds: readonly string[]): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>()
  for (const setId of setIds) {
    const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT "id" FROM "Card"
      WHERE "setId" = ${setId}
      ORDER BY ${CARD_NUMBER_ORDER_SQL}
      LIMIT ${SAME_SET_FETCH_LIMIT}
    `)
    result.set(setId, rows.map(r => r.id))
  }
  return result
}

function toSameSetRow(card: PublicCardRow): SameSetCardRow {
  return {
    id: card.id,
    name: card.name,
    externalId: card.externalId,
    language: card.language,
    game: card.game,
    cardNumber: card.cardNumber,
    isCollectible: card.isCollectible,
    imageSmall: card.imageSmall,
    imageLarge: card.imageLarge,
    canonicalCard: card.canonicalCard
      ? { imageSmall: card.canonicalCard.imageSmall, imageLarge: card.canonicalCard.imageLarge }
      : null,
  }
}

async function main() {
  console.log(`[card-pages] 模式：${APPLY ? 'apply' : 'dry-run'}`)

  const globalsCss = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')
  const css = extractThemeTokens(globalsCss)

  const sets = await prisma.cardSet.findMany({ select: { id: true } })
  const topSevenBySet = await fetchTopSevenIdsBySet(sets.map(s => s.id))

  console.log(`[card-pages] 系列數：${sets.length}`)

  // 一次撈全部卡片（含 set / canonicalCard 關聯），避免對 78k 張卡逐張查詢。
  const allCards = await prisma.card.findMany({ include: cardPublicInclude })
  const cardById = new Map(allCards.map(c => [c.id, c]))

  console.log(`[card-pages] 卡片數：${allCards.length}`)

  const local = new Map<string, string>() // key -> html content
  const urlByCardKey = new Map<string, string>() // R2 key -> public (encoded) URL
  const md5ByKey = new Map<string, string>()

  for (const card of allCards) {
    const topSeven = (topSevenBySet.get(card.setId) ?? [])
      .map(id => cardById.get(id))
      .filter((c): c is PublicCardRow => Boolean(c))
    const sameSet = topSeven
      .filter(c => c.id !== card.id)
      .slice(0, SAME_SET_DISPLAY_LIMIT)
      .map(toSameSetRow)

    // UI 語系跟卡片語言，麵包屑文案也一併跟著（不是固定 zh-TW）。
    const locale = CARD_UI_LOCALE[card.language]
    const t = getTranslations(locale)
    const breadcrumbItems = buildCardBreadcrumbItems(card, { home: t('nav.home'), cards: t('nav.cards') })
    const jsonLd = buildCardJsonLd(card, breadcrumbItems)
    const html = renderCardPage({ card, sameSet, locale, css, breadcrumbItems, jsonLd })

    const key = objectKeyFor(card)
    urlByCardKey.set(key, cardPageUrl(CARD_PAGES_ORIGIN!, card))
    local.set(key, html)
    md5ByKey.set(key, md5Hex(html))
  }

  const chunkCount = Math.max(1, Math.ceil(allCards.length / SITEMAP_CHUNK_SIZE))
  const cardKeysSorted = [...local.keys()].sort()
  local.set('robots.txt', buildSubdomainRobotsTxt(CARD_PAGES_ORIGIN!))
  local.set('sitemap.xml', buildSubdomainSitemapIndex(CARD_PAGES_ORIGIN!, chunkCount))
  for (let i = 0; i < chunkCount; i++) {
    const chunkUrls = cardKeysSorted
      .slice(i * SITEMAP_CHUNK_SIZE, (i + 1) * SITEMAP_CHUNK_SIZE)
      .map(key => urlByCardKey.get(key)!)
    local.set(`sitemaps/cards-${i}.xml`, buildSubdomainUrlSet(chunkUrls))
  }
  for (const key of ['robots.txt', 'sitemap.xml', ...Array.from({ length: chunkCount }, (_, i) => `sitemaps/cards-${i}.xml`)]) {
    md5ByKey.set(key, md5Hex(local.get(key)!))
  }

  if (INDEXNOW_KEY) {
    const keyObject = indexNowKeyObjectKey(INDEXNOW_KEY)
    local.set(keyObject, INDEXNOW_KEY)
    md5ByKey.set(keyObject, md5Hex(INDEXNOW_KEY))
  }

  const assetFiles = [
    ['logo-light-sm.svg', '_assets/logo-light-sm.svg'],
    ['logo-dark-sm.svg', '_assets/logo-dark-sm.svg'],
  ] as const
  for (const [publicFile, key] of assetFiles) {
    const content = readFileSync(join(process.cwd(), 'public', publicFile), 'utf8')
    local.set(key, content)
    md5ByKey.set(key, md5Hex(content))
  }

  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET
  const hasR2Config = Boolean(accountId && accessKeyId && secretAccessKey && bucket)

  if (!hasR2Config) {
    if (APPLY) throw new Error('缺少 R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET，無法 --apply')
    console.log('[card-pages] 未設定 R2 憑證，僅本機預覽：抽樣寫入 HTML 到 tools/card-pages/.preview/')
    mkdirSync(PREVIEW_DIR, { recursive: true })
    const sampleKeys = cardKeysSorted.slice(0, PREVIEW_SAMPLE_SIZE)
    for (const key of sampleKeys) {
      const filePath = join(PREVIEW_DIR, `${key.replace(/\//g, '__')}.html`)
      writeFileSync(filePath, local.get(key)!, 'utf8')
      console.log(`  - ${key} → ${filePath}`)
    }
    console.log(`[card-pages] 合計待產出物件：${local.size}（含 sitemap/robots/_assets）`)
    await prisma.$disconnect()
    return
  }

  const client = createR2Client({ accountId: accountId!, accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! })
  const remote = await listRemoteObjects(client, bucket!)
  const plan = planSync(md5ByKey, remote)

  console.log(`[card-pages] 新增/更新：${plan.upload.length}`)
  console.log(`[card-pages] 孤兒（將刪除）：${plan.remove.length}`)
  console.log(`[card-pages] 抽樣：${plan.upload.slice(0, 5).join(', ')}`)

  assertSafeRemoval(plan.remove, local.size)

  const indexNowUrls = pickIndexNowUrls(plan.upload, urlByCardKey)
  if (!APPLY) {
    console.log(`[card-pages] IndexNow（${describeIndexNow()}）：將推送 ${indexNowUrls.length} 筆`)
    await prisma.$disconnect()
    return
  }

  await uploadAll(client, bucket!, plan.upload, local)
  await deleteObjects(client, bucket!, plan.remove)

  console.log('[card-pages] 上傳完成')

  if (INDEXNOW_KEY && indexNowUrls.length > 0) {
    const result = await submitIndexNow(buildIndexNowPayloads(CARD_PAGES_ORIGIN!, INDEXNOW_KEY, indexNowUrls))
    console.log(`[card-pages] IndexNow（${INDEXNOW_MODE}）：成功 ${result.submitted}、失敗 ${result.failed}`)
  } else {
    console.log(`[card-pages] IndexNow（${describeIndexNow()}）：無需推送`)
  }
  await prisma.$disconnect()
}

function describeIndexNow(): string {
  if (!INDEXNOW_KEY) return '未設定 INDEXNOW_KEY，略過'
  return INDEXNOW_MODE
}

/** Card pages only (never robots/sitemaps/assets/key file); `all` resubmits every card page. */
function pickIndexNowUrls(uploadKeys: readonly string[], urlByCardKey: Map<string, string>): string[] {
  if (!INDEXNOW_KEY || INDEXNOW_MODE === 'off') return []
  if (INDEXNOW_MODE === 'all') return [...urlByCardKey.values()]
  return uploadKeys.flatMap(key => {
    const url = urlByCardKey.get(key)
    return url ? [url] : []
  })
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
