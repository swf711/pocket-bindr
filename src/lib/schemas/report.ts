import { z } from 'zod'

/**
 * 單一真相：缺卡/bug 回報類型列舉。
 */
export const REPORT_TYPES = ['missing_card', 'data_error', 'bug', 'other'] as const

export const reportTypeSchema = z.enum(REPORT_TYPES, {
  errorMap: () => ({ message: 'REPORT_TYPE_INVALID' }),
})

export const reportCardContextSchema = z.object({
  cardId: z.string(),
  cardName: z.string(),
  setExternalId: z.string(),
  cardNumber: z.string(),
})

export const reportSchema = z.object({
  type: reportTypeSchema,
  message: z
    .string()
    .trim()
    .min(10, 'REPORT_MESSAGE_TOO_SHORT')
    .max(2000, 'REPORT_MESSAGE_TOO_LONG'),
  cardContext: reportCardContextSchema.optional(),
})

export type ReportType = z.infer<typeof reportTypeSchema>
export type ReportCardContext = z.infer<typeof reportCardContextSchema>
export type ReportInput = z.infer<typeof reportSchema>

/**
 * 回報附件限制：前端壓縮／後端驗證共用同一組常數，避免前後端門檻漂移。
 * 單檔 2MB、最多 3 張、總計 4MB —— 保守低於 Vercel serverless ~4.5MB request body 上限。
 */
export const MAX_REPORT_ATTACHMENTS = 3
export const MAX_REPORT_ATTACHMENT_BYTES = 2 * 1024 * 1024
export const MAX_REPORT_ATTACHMENT_TOTAL_BYTES = 4 * 1024 * 1024
export const ALLOWED_REPORT_ATTACHMENT_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
])
