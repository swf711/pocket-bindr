import { createTranslator } from 'use-intl/core'
import type { Locale } from '@/i18n/locale'
import zhTW from '../../messages/zh-TW.json'
import en from '../../messages/en.json'
import ja from '../../messages/ja.json'

/**
 * `next-intl` 的入口會 re-export React provider（`useTranslations` 等 hook），在純 Node（tsx 執行、
 * 無 Next 打包器）環境 import 會連帶把 client-only 程式碼拉進來。改用 `use-intl/core` 的
 * `createTranslator`——與 src/lib/og-messages.ts 對 OG 路由的取捨相同（避免 request-scoped
 * `getTranslations()`），差別是這裡連 `next-intl` 套件本身都不 import。
 */
const MESSAGES: Record<Locale, Record<string, unknown>> = { 'zh-TW': zhTW, en, ja }

/**
 * 型別刻意放寬為任意字串 key：`createTranslator` 的嚴格 key 型別是從字面量 messages 物件推導，
 * 這裡的 MESSAGES 為 `Record<Locale, Record<string, unknown>>`（三語結構在編譯期並非同一字面型別），
 * 嚴格推導會退化成 `never`。產生器只需要「傳入完整路徑 key 換回字串」，不需要編譯期 key 檢查
 * （三語 key 是否同步已由既有 i18n 測試把關）。
 */
export type CardPageTranslator = (key: string, values?: Record<string, string | number>) => string

export function getTranslations(locale: Locale): CardPageTranslator {
  return createTranslator({ locale, messages: MESSAGES[locale] }) as unknown as CardPageTranslator
}
