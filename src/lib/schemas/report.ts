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
