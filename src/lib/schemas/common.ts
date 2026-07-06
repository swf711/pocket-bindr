import { z } from 'zod'
import { GridType, CardStatus } from '@prisma/client'
import { isPasswordValid } from '@/lib/password-policy'

/**
 * 單一真相：卡冊格線型別列舉。
 * 原本分別在 src/app/api/binders/route.ts 與
 * src/app/api/binders/[id]/route.ts 各自定義 `VALID_GRID_TYPES: Set<GridType>`，
 * 現統一由這裡的 zod enum 衍生，其餘處 import。
 */
export const GRID_TYPE_VALUES = [
  'grid_1x2',
  'grid_2x2',
  'grid_3x3',
  'grid_4x3',
  'grid_4x4',
] as const satisfies readonly GridType[]

export const gridTypeSchema = z.enum(GRID_TYPE_VALUES, {
  errorMap: () => ({ message: 'GRID_TYPE_INVALID' }),
})

/**
 * 單一真相：hex 色碼格式（例如卡冊封面色）。
 * 原本 HEX_COLOR_RE 分別重複定義於
 * src/app/api/binders/route.ts 與 src/app/api/binders/[id]/route.ts。
 */
export const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/

export const hexColorSchema = z
  .string()
  .regex(HEX_COLOR_RE, 'COVER_COLOR_INVALID')

/**
 * 密碼硬性規則（唯一真相 src/lib/password-policy.ts 的 isPasswordValid）。
 * 不重寫規則邏輯，只包一層 zod refine。
 */
export const passwordSchema = z
  .string()
  .refine(isPasswordValid, 'PASSWORD_TOO_SHORT')

/**
 * 單一真相：BinderSlot / UserCard 狀態列舉。
 * 原本分別在 src/app/api/binders/[id]/slots/route.ts 與
 * src/app/api/binders/[id]/cards/route.ts 各自定義 `VALID_STATUSES: Set<CardStatus>`。
 * 僅用於「是否合法」判斷，各 route 仍回自己原本的錯誤字串（不使用這裡的 errorMap 訊息）。
 */
export const CARD_STATUS_VALUES = ['owned', 'wanted'] as const satisfies readonly CardStatus[]

export const cardStatusSchema = z.enum(CARD_STATUS_VALUES)
