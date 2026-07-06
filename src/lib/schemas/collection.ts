import { z } from 'zod'
import { CardStatus, Game } from '@prisma/client'

/**
 * 單一真相：GET /api/cards、GET /api/collection、POST /api/collection
 * 共用的 status / game 列舉驗證。原本各自用 `Object.values(CardStatus).includes(x)` /
 * `Object.values(Game).includes(x as Game)` 手刻檢查，這裡改用 zod nativeEnum。
 * 僅用於「是否合法」判斷，各 route 仍回自己原本的錯誤字串。
 */
export const cardStatusSchema = z.nativeEnum(CardStatus)
export const gameSchema = z.nativeEnum(Game)

/** POST /api/collection body（cardId 必填、status 可為 null、deleteStatus 於 status=null 時使用） */
export const collectionCardIdSchema = z.string().min(1)
