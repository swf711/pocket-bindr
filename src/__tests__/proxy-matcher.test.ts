import { describe, it, expect, vi } from 'vitest'

// proxy.ts 在 module 載入時就會呼叫 NextAuth(authConfig)，mock 掉避免測試環境需要完整 env。
vi.mock('next-auth', () => ({
  default: () => ({ auth: vi.fn() }),
}))

import { config } from '../proxy'
import { protectedRoutes } from '@/lib/auth.config'

describe('proxy matcher', () => {
  it('auth.config.ts 的每一條 protectedRoutes 都有對應的 matcher 條目', () => {
    // matcher 必須是字面陣列（Next 需靜態分析），無法直接引用 protectedRoutes，
    // 故以此交叉測試守住兩者一致——新增受保護路由時若忘了補 matcher，這裡會紅。
    for (const route of protectedRoutes) {
      expect(config.matcher).toContain(`${route}/:path*`)
    }
  })

  it('matcher 不含任何公開路由（收斂後公開頁面完全不進 proxy）', () => {
    expect(config.matcher).toHaveLength(protectedRoutes.length)
  })

  it('matcher 不是 catch-all（catch-all 會讓 NextAuth 跑在每個公開頁面請求上）', () => {
    for (const pattern of config.matcher) {
      expect(pattern).not.toContain('(?!')
      expect(pattern.startsWith('/binders') || pattern.startsWith('/settings') || pattern.startsWith('/collection')).toBe(true)
    }
  })
})
