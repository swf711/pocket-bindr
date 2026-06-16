import { test, expect } from '@playwright/test'

/**
 * 對應 docs/BDD.md 卡牌瀏覽：PTCG JA 舊世代補圖（pcg-search → Supabase Storage 自存）。
 *
 * 此 spec 需 DB 已由 scripts/backfill-ja-legacy-images.ts --apply 補圖
 *（依賴 SUPABASE_URL / SERVICE_ROLE_KEY）。若該 set 尚未補圖，第一張卡會顯示
 * 「無圖片」fallback，本測試自動 skip（見 docs/TECH_DEBT.md 條件式 E2E）。
 */
test.describe('PTCG JA 舊世代補圖', () => {
  test('neo1 舊卡顯示自存圖（Supabase URL，非 proxy）', async ({ page }) => {
    await page.goto('/cards?game=PTCG&language=JA&setId=ja-neo1')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    const firstCard = page.getByTestId('card-item').first()
    await firstCard.waitFor({ timeout: 10000 })

    // 尚未補圖（仍是文字 placeholder）→ 條件式 skip
    const isFallback = await firstCard.getByTestId('card-image-fallback').count()
    test.skip(isFallback > 0, 'neo1 尚未執行 --apply 補圖，略過（需 SUPABASE 金鑰）')

    const img = firstCard.locator('img')
    await expect(img).toBeVisible()
    const src = await img.getAttribute('src')
    expect(src).toContain('.supabase.co')
    expect(src).not.toContain('/api/proxy-image')
  })
})
