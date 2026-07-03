-- Enable trigram matching so `Card.name ILIKE '%q%'` (used by GET /api/cards name
-- search, both the setId and cross-set branches) can use a GIN index instead of a
-- full sequential scan on large languages (PTCG JA ~24k rows). IF NOT EXISTS keeps
-- this idempotent across shadow DB / re-deploy. See TECH_DEBT「Card.name 模糊搜尋無索引」.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "Card_name_trgm_idx" ON "Card" USING gin ("name" gin_trgm_ops);
