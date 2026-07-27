/*
  兩個索引皆為降低 Supabase 冷讀 IO 而加（真瓶頸是 heap page 讀取量，不是演算法）。
  `IF NOT EXISTS` 保持跨 shadow DB / 重跑的冪等性，慣例同 20260704005011_add_card_name_trgm。

  NOTE: Prisma 無法表達 gin_trgm_ops 與表達式索引，`migrate dev` 會自動想
  DROP INDEX "Card_name_trgm_idx"（來自 20260704005011_add_card_name_trgm）。
  已手動從本 migration 移除該 DROP INDEX，勿還原。
  下方 lower("externalId") 索引同樣無法寫進 schema.prisma，只存在於本檔。
*/

-- 首頁 getTotalCardCount 的 `count(*) WHERE "isCollectible"`。
-- 選擇度低（true 佔 93%）對 index-only scan 無妨——它掃的是 ~1 MB 的索引而非 55 MB 的 heap。
CREATE INDEX IF NOT EXISTS "Card_isCollectible_idx" ON "Card"("isCollectible");

-- src/lib/public-card.ts 的 getPublicCardByTriple case-insensitive 兜底。
-- 未加此索引時只能用 (game, language) 前綴再逐列 filter，PTCG JA 一次 miss 要讀約 12,900 個 buffer。
-- ⚠️ 消費端必須用 `lower("externalId") = lower($n)` 的 $queryRaw；
-- Prisma 的 `mode: 'insensitive'` 產生 ILIKE，用不到這個索引。
CREATE INDEX IF NOT EXISTS "Card_game_language_lower_externalId_idx"
  ON "Card" ("game", "language", lower("externalId"));
