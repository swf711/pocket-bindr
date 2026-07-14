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
};

export default withNextIntl(nextConfig);
