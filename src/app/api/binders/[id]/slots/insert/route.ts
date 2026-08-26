import { planSlotInsertion } from '@/lib/binder-slot-placement'
import { handleSlotShift } from '../shift-handler'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * 在指定格位「之前」插入一個空格，該格與其後的連續格位往後順延，
 * 推到全卡冊第一個空位為止。實作與「移除空格」共用 `handleSlotShift`。
 */
export async function POST(request: Request, context: RouteContext) {
  return handleSlotShift(request, context, planSlotInsertion)
}
