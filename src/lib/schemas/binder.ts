import { z } from 'zod'
import { gridTypeSchema, hexColorSchema, cardStatusSchema } from '@/lib/schemas/common'
import { DEFAULT_COVER_COLOR } from '@/lib/cover-colors'

const nameSchema = z
  .string()
  .trim()
  .min(1, 'BINDER_NAME_REQUIRED')
  .max(50, 'BINDER_NAME_TOO_LONG')

const descriptionSchema = z
  .string()
  .trim()
  .max(150, 'DESCRIPTION_TOO_LONG')
  .optional()
  .transform((v) => v || null)

/** POST /api/binders */
export const binderCreateSchema = z.object({
  name: nameSchema,
  gridType: gridTypeSchema,
  coverColor: hexColorSchema.optional().default(DEFAULT_COVER_COLOR),
  description: descriptionSchema,
})

/**
 * PATCH /api/binders/[id]：所有欄位皆為 partial update（僅提供的欄位才驗證/更新）。
 * coverColor 這裡不套用 default，undefined 代表「不更新」。
 */
export const binderUpdateSchema = z.object({
  name: nameSchema.optional(),
  gridType: gridTypeSchema.optional(),
  coverColor: hexColorSchema.optional(),
  description: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (typeof v === 'string' ? v.trim() || null : v)),
})

/** PATCH /api/binders/reorder */
export const bindersReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1, 'orderedIds must be a non-empty array of strings'),
})

/** PATCH /api/binders/[id]/slots/swap */
export const slotsSwapSchema = z.object({
  slotAId: z.string().min(1),
  slotBId: z.string().min(1),
})

/** PATCH /api/binders/[id]/pages/reorder */
export const pagesSwapSchema = z.object({
  pageA: z.number().int().min(1),
  pageB: z.number().int().min(1),
}).refine((v) => v.pageA !== v.pageB)

/** PATCH /api/binders/[id]/pages/reorder-bulk */
export const pagesReorderBulkSchema = z.object({
  newOrder: z.array(z.number().int().min(1)).min(1),
})

/**
 * POST /api/binders/[id]/slots
 * slotIndex 上限依 binder.gridType 動態決定，schema 只驗證「非負整數」，
 * 上限比對仍留在 route 內（需要 binder 這個 runtime 值）。
 */
export const slotCreateSchema = z.object({
  pageNumber: z.number().int().min(1),
  slotIndex: z.number().int().min(0),
  cardId: z.string().min(1),
  status: cardStatusSchema,
})

/**
 * PATCH /api/binders/[id]/slots/[slotId]
 * 原本只檢查 `typeof pageNumber === 'number'`，未限制整數/正負，維持原樣寬鬆。
 */
export const slotPositionSchema = z.object({
  pageNumber: z.number(),
  slotIndex: z.number(),
})

/** POST /api/binders/[id]/cards */
export const addCardsSchema = z.object({
  quantity: z.number().int().min(1).max(99),
  status: cardStatusSchema,
})

export type BinderCreateInput = z.infer<typeof binderCreateSchema>
export type BinderUpdateInput = z.infer<typeof binderUpdateSchema>
