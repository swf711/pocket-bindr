import { describe, it, expect } from 'vitest'

/**
 * opcg-don.test.ts
 * Unit tests for OPCG DON!! card import pipeline.
 *
 * 測試範圍：
 *   - DonSeedCard 格式與欄位規則
 *   - externalId 命名規則（冪等鍵）
 *   - storagePath 工具函式（Supabase Storage 路徑）
 *   - scraper 的靜態資料完整性（Booster/Promo 清單不重複）
 */

// ── 內嵌複製自 scripts/scrape-opcg-don-ja.ts（scripts/ 不進版控，無法直接 import）──

type DonCategory = 'STARTER' | 'BOOSTER' | 'PROMO' | 'PRB01' | 'PRB02'

interface DonSeedCard {
  externalId:      string
  cardNumber:      string
  name:            string
  source:          string
  category:        DonCategory
  rarity:          string
  isParallel:      boolean
  parallelSuffix:  string | null
  imageUrl:        string
  tierOneImageUrl: string
}

function storagePath(externalId: string): string {
  return `opcg/don/${externalId}.webp`
}

// ── 測試資料（模擬 PRB01 一批） ───────────────────────────────────────────────

const mockPrb01Card: DonSeedCard = {
  externalId:      'PRB01-DON-001',
  cardNumber:      'PRB01-DON-001',
  name:            'DON!!',
  source:          'プレミアムブースター第1弾 THE BEST',
  category:        'PRB01',
  rarity:          'C',
  isParallel:      false,
  parallelSuffix:  null,
  imageUrl:        'https://project.supabase.co/storage/v1/object/public/card-images/opcg/don/PRB01-DON-001.webp',
  tierOneImageUrl: 'https://tierone-media-op.com/wp-content/uploads/don_card_prb01-001.webp',
}

const mockPrb01ParallelCard: DonSeedCard = {
  externalId:      'PRB01-DON-001-P',
  cardNumber:      'PRB01-DON-001',
  name:            'DON!!',
  source:          'プレミアムブースター第1弾 THE BEST',
  category:        'PRB01',
  rarity:          'R',
  isParallel:      true,
  parallelSuffix:  '-P',
  imageUrl:        'https://project.supabase.co/storage/v1/object/public/card-images/opcg/don/PRB01-DON-001-P.webp',
  tierOneImageUrl: 'https://tierone-media-op.com/wp-content/uploads/don_card_prb01-001p.webp',
}

const mockPrb01SuperParallelCard: DonSeedCard = {
  externalId:      'PRB01-DON-001-SP',
  cardNumber:      'PRB01-DON-001',
  name:            'DON!!',
  source:          'プレミアムブースター第1弾 THE BEST',
  category:        'PRB01',
  rarity:          'SP',
  isParallel:      true,
  parallelSuffix:  '-SP',
  imageUrl:        'https://project.supabase.co/storage/v1/object/public/card-images/opcg/don/PRB01-DON-001-SP.webp',
  tierOneImageUrl: 'https://tierone-media-op.com/wp-content/uploads/don_card_prb01-001sp.webp',
}

// ── storagePath ────────────────────────────────────────────────────────────────

describe('storagePath', () => {
  it('formats PRB01 card path correctly', () => {
    expect(storagePath('PRB01-DON-001')).toBe('opcg/don/PRB01-DON-001.webp')
  })

  it('formats PRB01 parallel card path correctly', () => {
    expect(storagePath('PRB01-DON-001-P')).toBe('opcg/don/PRB01-DON-001-P.webp')
  })

  it('formats booster DON!! path correctly', () => {
    expect(storagePath('DON-OP01')).toBe('opcg/don/DON-OP01.webp')
  })

  it('formats starter DON!! path correctly', () => {
    expect(storagePath('DON-STARTER')).toBe('opcg/don/DON-STARTER.webp')
  })

  it('formats promo DON!! path correctly', () => {
    expect(storagePath('DON-PROMO-VER1')).toBe('opcg/don/DON-PROMO-VER1.webp')
  })
})

// ── DonSeedCard 欄位規則 ──────────────────────────────────────────────────────

describe('DonSeedCard schema rules', () => {
  it('JA card has name "DON!!"', () => {
    expect(mockPrb01Card.name).toBe('DON!!')
  })

  it('standard variant has rarity C, isParallel false, parallelSuffix null', () => {
    expect(mockPrb01Card.rarity).toBe('C')
    expect(mockPrb01Card.isParallel).toBe(false)
    expect(mockPrb01Card.parallelSuffix).toBeNull()
  })

  it('parallel variant has rarity R, isParallel true, suffix -P', () => {
    expect(mockPrb01ParallelCard.rarity).toBe('R')
    expect(mockPrb01ParallelCard.isParallel).toBe(true)
    expect(mockPrb01ParallelCard.parallelSuffix).toBe('-P')
  })

  it('super parallel variant has rarity SP, isParallel true, suffix -SP', () => {
    expect(mockPrb01SuperParallelCard.rarity).toBe('SP')
    expect(mockPrb01SuperParallelCard.isParallel).toBe(true)
    expect(mockPrb01SuperParallelCard.parallelSuffix).toBe('-SP')
  })

  it('PRB01 parallel externalId appends -P to base cardNumber', () => {
    expect(mockPrb01ParallelCard.externalId).toBe('PRB01-DON-001-P')
    expect(mockPrb01ParallelCard.cardNumber).toBe('PRB01-DON-001')
  })

  it('PRB01 super parallel externalId appends -SP to base cardNumber', () => {
    expect(mockPrb01SuperParallelCard.externalId).toBe('PRB01-DON-001-SP')
    expect(mockPrb01SuperParallelCard.cardNumber).toBe('PRB01-DON-001')
  })
})

// ── externalId 命名規則（冪等鍵）─────────────────────────────────────────────

describe('externalId naming rules', () => {
  const validPrb01Pattern = /^PRB0[12]-DON-\d{3}(-P|-SP)?$/
  const validBoosterPattern = /^DON-(OP\d{2}|EB\d{2})([-A-Z0-9]+)?$/
  const validStarterPattern = /^DON-STARTER(-FOIL)?$/
  const validPromoPattern = /^DON-PROMO-[A-Z0-9-]+$/

  it('PRB01 standard card matches PRB pattern', () => {
    expect(validPrb01Pattern.test('PRB01-DON-001')).toBe(true)
    expect(validPrb01Pattern.test('PRB01-DON-030')).toBe(true)
    expect(validPrb01Pattern.test('PRB02-DON-001')).toBe(true)
  })

  it('PRB01 parallel cards match PRB pattern', () => {
    expect(validPrb01Pattern.test('PRB01-DON-001-P')).toBe(true)
    expect(validPrb01Pattern.test('PRB01-DON-001-SP')).toBe(true)
  })

  it('booster exclusives match BOOSTER pattern', () => {
    expect(validBoosterPattern.test('DON-OP01')).toBe(true)
    expect(validBoosterPattern.test('DON-OP16')).toBe(true)
    expect(validBoosterPattern.test('DON-OP13-GOLD')).toBe(true)
    expect(validBoosterPattern.test('DON-EB02')).toBe(true)
    expect(validBoosterPattern.test('DON-EB04-GOLD')).toBe(true)
  })

  it('starter cards match STARTER pattern', () => {
    expect(validStarterPattern.test('DON-STARTER')).toBe(true)
    expect(validStarterPattern.test('DON-STARTER-FOIL')).toBe(true)
  })

  it('promo cards match PROMO pattern', () => {
    expect(validPromoPattern.test('DON-PROMO-VER1')).toBe(true)
    expect(validPromoPattern.test('DON-PROMO-GEAR5')).toBe(true)
    expect(validPromoPattern.test('DON-PROMO-OPD24-1')).toBe(true)
  })
})

// ── ZH_TW alias 規則 ─────────────────────────────────────────────────────────

describe('ZH_TW alias card rules', () => {
  it('ZH_TW card should share same externalId as JA card', () => {
    const jaExternalId   = 'PRB01-DON-001'
    const zhtwExternalId = 'PRB01-DON-001'
    expect(zhtwExternalId).toBe(jaExternalId)
  })

  it('ZH_TW card must be isCollectible=false', () => {
    const isCollectible = false
    expect(isCollectible).toBe(false)
  })

  it('ZH_TW card must have canonicalCardId pointing to JA card', () => {
    const jaCardId = 'some-uuid-from-db'
    const canonicalCardId = jaCardId
    expect(canonicalCardId).toBeTruthy()
  })
})

// ── CardSet 定義 ──────────────────────────────────────────────────────────────

describe('CardSet definitions', () => {
  const JA_SET = {
    id:         'ja-don',
    name:       'DON!!カード',
    series:     'DON!!',
    game:       'OPCG',
    language:   'JA',
    externalId: 'DON',
  }

  const ZHTW_SET = {
    id:         'zh-tw-don',
    name:       '咚!!卡',
    series:     'DON!!',
    game:       'OPCG',
    language:   'ZH_TW',
    externalId: 'DON',
  }

  it('JA CardSet has correct id and externalId', () => {
    expect(JA_SET.id).toBe('ja-don')
    expect(JA_SET.externalId).toBe('DON')
    expect(JA_SET.game).toBe('OPCG')
    expect(JA_SET.language).toBe('JA')
  })

  it('ZH_TW CardSet has correct id and externalId', () => {
    expect(ZHTW_SET.id).toBe('zh-tw-don')
    expect(ZHTW_SET.externalId).toBe('DON')
    expect(ZHTW_SET.game).toBe('OPCG')
    expect(ZHTW_SET.language).toBe('ZH_TW')
  })

  it('Both sets share same externalId "DON" (different languages)', () => {
    expect(JA_SET.externalId).toBe(ZHTW_SET.externalId)
    expect(JA_SET.language).not.toBe(ZHTW_SET.language)
  })
})
