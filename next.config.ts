import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { version } from "./package.json";
import { SECURITY_HEADERS } from "./src/lib/security-headers";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// 靜態卡片頁子網域總開關：未設時 next.config 完全不加轉址規則（休眠上線、行為零變）。
const CARD_PAGES_ORIGIN = process.env.NEXT_PUBLIC_CARD_PAGES_ORIGIN;

const nextConfig: NextConfig = {
  /* config options here */
  // 版號 single source of truth = package.json；footer 為 client component，
  // process.env.npm_package_version 讀不到，必須 build-time inline 為 NEXT_PUBLIC_*。
  env: { NEXT_PUBLIC_APP_VERSION: version },
  // 開發期允許從區域網路 IP 存取 dev server（手機/平板實機測試）。
  // 用網段萬用字元而非寫死單一 IP：DHCP 或換路由器都會讓本機 IP 變動，
  // 寫死的話一變就會被 Next 的 dev CSRF 保護擋掉 dev 資產請求，症狀是頁面一直轉、跑不出東西。
  // Next 的比對是「以 . 逐段」的萬用字元匹配（server/app-render/csrf-protection.js），
  // 故 192.168.*.* 可涵蓋整個私有網段；localhost 為內建預設、不需列出。
  allowedDevOrigins: ['192.168.*.*'],
  // Baseline security headers on every route (CSP is Report-Only, see src/lib/security-headers.ts).
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
  ...(CARD_PAGES_ORIGIN
    ? {
        async redirects() {
          return [
            {
              // 只比對五段中的三段（/cards/{game}/{language}/{externalId}），
              // OG 圖路由 /cards/.../opengraph-image 多一段不會被此規則命中。
              source: '/cards/:game(ptcg|opcg)/:language(en|ja|zh-tw)/:externalId',
              // App Router 的導航／prefetch／refresh 一律帶 rsc header；Server Action 的
              // POST 不帶 rsc 但帶 next-action。兩者都要排除，否則指令面板切語言、
              // 或 modal 開著時的內部導航會被誤轉到子網域而失敗。
              missing: [
                { type: 'header', key: 'rsc' },
                { type: 'header', key: 'next-action' },
              ],
              destination: `${CARD_PAGES_ORIGIN}/:game/:language/:externalId`,
              // `permanent: true` 實際會發 308；此處明確指定 301。
              statusCode: 301,
            },
          ];
        },
      }
    : {}),
};

export default withNextIntl(nextConfig);
