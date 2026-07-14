import { createTranslator } from 'next-intl'
import { DEFAULT_LOCALE } from '@/i18n/locale'
import zhTW from '../../messages/zh-TW.json'

/**
 * OG 文案取用——一律固定 DEFAULT_LOCALE（zh-TW），不隨請求語言浮動。
 * OG response 是「一個 URL 一份共用 CDN 快取產物」，若文案隨 Accept-Language 變動，
 * 快取一開就會把第一個抓取者（多半是爬蟲）的語言凍結給所有後續平台。
 * 用 next-intl 的 `createTranslator`（非 request-scoped API，不觸發 `getRequestConfig`
 * 讀取 cookies()/headers()）取代 `getTranslations()`，讓 OG 路由本身仍是可被 CDN 快取的靜態文案。
 */
const t = createTranslator({ locale: DEFAULT_LOCALE, messages: zhTW })

export function ogMessage(key: Parameters<typeof t>[0], values?: Record<string, string | number>): string {
  return t(key, values)
}
