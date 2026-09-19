import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)
export { auth as proxy }

// matcher 刻意只涵蓋受保護路由。先前為 catch-all，等於讓 NextAuth 在每一個公開頁面請求上
// 初始化並執行一次（74k 張卡片頁、/sitemap.xml、/robots.txt、opengraph-image 全包含在內），
// 但 authConfig.callbacks.authorized 對非保護路由一律 return true——純粹是白付的
// invocation 與 Active CPU。收斂後公開路由完全不進 proxy。
//
// 🔴 必須是字面陣列：Next 需在 build 期靜態分析 matcher，不能從 auth.config.ts 的
// protectedRoutes 動態組出。兩者的一致性由 src/__tests__/proxy-matcher.test.ts 交叉驗證。
//
// ⚠️ 後續若導入 next-intl 的 locale rewrite，matcher 需重新放寬以涵蓋公開頁面，
// 屆時 NextAuth 仍須限於 protectedRoutes，不可退回 catch-all 的執行範圍。
export const config = {
  matcher: ['/binders/:path*', '/settings/:path*', '/collection/:path*'],
}
