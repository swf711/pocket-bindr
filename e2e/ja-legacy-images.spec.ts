import { test, expect } from './helpers/test'

/**
 * PTCG JA 舊世代卡牌的自存圖片（Supabase Storage）瀏覽驗證。
 *
 * 此 spec 需 DB 已由內部維護腳本完成補圖（依賴 SUPABASE_URL / SERVICE_ROLE_KEY）。
 * 若該 set 尚未補圖，第一張卡會顯示「無圖片」fallback，本測試自動 skip。
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
