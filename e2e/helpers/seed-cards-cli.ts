import { seedCardData } from './seed-cards'

/**
 * 手動灌入 E2E 卡牌 seed 子集（不跑測試）：`pnpm test:e2e:seed-cards`。
 * 獨立於 playwright（不被 testMatch/globalSetup import），故不受其 ESM loader 限制。
 */
seedCardData()
  .then(({ sets, cards }) => {
    console.log(`[e2e] seeded ${sets} CardSet, ${cards} Card`)
    process.exit(0)
  })
  .catch((err) => {
    console.error('[e2e] seed cards failed:', err)
    process.exit(1)
  })
