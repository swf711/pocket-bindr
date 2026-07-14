import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { version } from "./package.json";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
  // 版號 single source of truth = package.json；footer 為 client component，
  // process.env.npm_package_version 讀不到，必須 build-time inline 為 NEXT_PUBLIC_*。
  env: { NEXT_PUBLIC_APP_VERSION: version },
  allowedDevOrigins: ['192.168.11.5'],
  // OG 字型（public/fonts/*）由 readFileSync 於 runtime 讀取，非 import——tracing 不一定能靜態分析到，
  // 明確帶進三支 opengraph-image route 的 function bundle，避免部署後 ENOENT。
  outputFileTracingIncludes: {
    '/opengraph-image': ['./public/fonts/**'],
    '/b/[token]/opengraph-image': ['./public/fonts/**'],
    '/cards/[game]/[language]/[externalId]/opengraph-image': ['./public/fonts/**'],
  },
};

export default withNextIntl(nextConfig);
