import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { version } from "./package.json";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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
};

export default withNextIntl(nextConfig);
