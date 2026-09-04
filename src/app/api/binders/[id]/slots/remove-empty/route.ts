import { planSlotRemoval } from '@/lib/binder-slot-placement'
import { handleSlotShift } from '../shift-handler'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * 移除指定的**空格**，其後的連續格位往前遞補填掉它——與 `slots/insert` 互為反向操作。
 * 目標格若有卡則視為 noop（回 200 + 空 moves），不當成錯誤。
 */
export async function POST(request: Request, context: RouteContext) {
  return handleSlotShift(request, context, planSlotRemoval)
}
