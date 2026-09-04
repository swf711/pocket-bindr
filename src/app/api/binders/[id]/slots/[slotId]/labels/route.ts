import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePublicBinder } from '@/lib/binder-cache'
import { slotLabelsSchema } from '@/lib/schemas/binder'

type RouteContext = { params: Promise<{ id: string; slotId: string }> }

/**
 * 設定／清除單一格位的自訂標籤（如圖鑑編號、稀有度、待換標記）。
 * 送出的陣列即最終狀態，空陣列＝清除全部。
 *
 * 跨格群組是同一張實體卡的多個區塊，標籤只掛 anchor（groupIndex 0）——
 * 從任一成員格呼叫都會寫到 anchor，回傳的 slotId 即 anchor 的 id，
 * 前端據此更新對的那一格。
 *
 * 標籤會出現在公開分享頁，故收尾必須 revalidatePublicBinder。
 */
export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id: binderId, slotId } = await context.params

  const binder = await prisma.binder.findUnique({ where: { id: binderId } })
  if (!binder) return Response.json({ error: 'Not found' }, { status: 404 })
  if (binder.userId !== session.user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = slotLabelsSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'INVALID_INPUT' },
      { status: 400 },
    )
  }
  const { labels } = parsed.data

  const slot = await prisma.binderSlot.findUnique({ where: { id: slotId } })
  if (!slot || slot.binderId !== binderId) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  if (!slot.cardId || !slot.status) {
    return Response.json({ error: 'Slot has no card' }, { status: 400 })
  }

  // 群組成員 → 改寫 anchor。找不到 anchor（資料不完整）時退回寫自己，寧可少一層跳轉也不要整個失敗。
  let targetId = slot.id
  if (slot.groupId && slot.groupIndex !== 0) {
    const anchor = await prisma.binderSlot.findFirst({
      where: { binderId, groupId: slot.groupId, groupIndex: 0 },
      select: { id: true },
    })
    if (anchor) targetId = anchor.id
  }

  await prisma.binderSlot.update({ where: { id: targetId }, data: { labels } })

  revalidatePublicBinder(binder.shareToken)
  return Response.json({ slotId: targetId, labels })
}
