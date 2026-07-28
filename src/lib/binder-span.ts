import type { CardStatus, Prisma } from '@prisma/client'
import { groupSlotIndices, planGroupPlacement, slotKey } from '@/lib/binder-slot-placement'
import { resolveSpanLayout, type SpanLayout } from '@/lib/multi-card-layout'
import { slotDisplaySelect } from '@/lib/slot-display'

/**
 * binder-span.ts
 * 跨格群組（BinderSlotGroup）的**寫入端**共用邏輯：單張加入、批次加入、指定格位加入、
 * 單格↔跨格切換皆走這裡，避免三個 route 各寫一份矩形放置而語意漂移。
 *
 * 幾何判定在 `multi-card-layout.ts`，矩形搜尋在 `binder-slot-placement.ts`，本檔只負責
 * 「把演算法結果落成 DB rows」。
 */

/** 卡冊目前的格位佔用狀況；跨格放置需要一次看完整本卡冊，故先撈成記憶體索引。 */
export interface BinderCellIndex {
  /** 已填卡的格位，key 為 `slotKey()` */
  occupied: Set<string>
  /** 既有但未填卡的 row（key → id）：可直接改填，不必新建，避免撞 unique constraint */
  vacantRowIds: Map<string, string>
}

export async function loadBinderCells(
  tx: Prisma.TransactionClient,
  binderId: string,
): Promise<BinderCellIndex> {
  const rows = await tx.binderSlot.findMany({
    where: { binderId },
    select: { id: true, pageNumber: true, slotIndex: true, cardId: true },
  })
  const occupied = new Set<string>()
  const vacantRowIds = new Map<string, string>()
  for (const row of rows) {
    const key = slotKey(row.pageNumber, row.slotIndex)
    if (row.cardId) occupied.add(key)
    else vacantRowIds.set(key, row.id)
  }
  return { occupied, vacantRowIds }
}

export type PlaceSpanGroupResult =
  | { status: 'placed'; totalPages: number; pageNumber: number; slotIndices: number[] }
  /** 此格線容不下該形狀 → 呼叫端應退回單格放置 */
  | { status: 'unsupported' }
  | { status: 'pageLimit' }

/**
 * 放置一組跨格群組並寫入 DB。
 *
 * 群組內**每個格位都是自足的完整 row**（各自帶 cardId / displayCardId / status），
 * 只多帶 groupId / groupIndex。如此既有「找空格」查詢（cardId: null）與
 * `@@unique([binderId, pageNumber, slotIndex])` 天然防重疊、無須感知群組；
 * 代價是統計與 quantity 需排除 groupIndex > 0（見 binder-utils.ts）。
 *
 * ⚠️ 會就地更新傳入的 `cells`，讓呼叫端可以連續放置多組（quantity > 1）。
 */
export async function placeSpanGroup(
  tx: Prisma.TransactionClient,
  params: {
    binderId: string
    cardId: string
    displayCardId: string | null
    status: CardStatus
    layout: SpanLayout
    cells: BinderCellIndex
    gridCols: number
    slotsPerPage: number
    totalPages: number
    /** 同頁優先（單格↔跨格切換時避免把卡搬到別頁） */
    preferPage?: number
  },
): Promise<PlaceSpanGroupResult> {
  const { binderId, cardId, displayCardId, status, layout, cells, gridCols, slotsPerPage } = params

  const placement = planGroupPlacement({
    occupied: cells.occupied,
    gridCols,
    slotsPerPage,
    totalPages: params.totalPages,
    cols: layout.cols,
    rows: layout.rows,
    preferPage: params.preferPage,
  })

  if (placement.status !== 'placed') return placement

  const group = await tx.binderSlotGroup.create({
    data: {
      binderId,
      cols: layout.cols,
      rows: layout.rows,
      rotation: layout.rotation,
    },
    select: { id: true },
  })

  for (const [groupIndex, slotIndex] of placement.slotIndices.entries()) {
    const key = slotKey(placement.pageNumber, slotIndex)
    const data = {
      cardId,
      displayCardId,
      status,
      groupId: group.id,
      groupIndex,
    }
    const vacantId = cells.vacantRowIds.get(key)
    if (vacantId) {
      await tx.binderSlot.update({ where: { id: vacantId }, data })
      cells.vacantRowIds.delete(key)
    } else {
      await tx.binderSlot.create({
        data: { binderId, pageNumber: placement.pageNumber, slotIndex, ...data },
      })
    }
    cells.occupied.add(key)
  }

  return {
    status: 'placed',
    totalPages: placement.newPage ? placement.pageNumber : params.totalPages,
    pageNumber: placement.pageNumber,
    slotIndices: placement.slotIndices,
  }
}

/**
 * 讀取卡冊目前頁數：`settings.totalPages` 與實際最大頁碼取大（與 Server Component
 * 頁面、GET /api/binders/[id] 的算式逐字元一致，避免三處漂移）。
 */
export async function resolveTotalPages(
  tx: Prisma.TransactionClient,
  binderId: string,
  settings: Prisma.JsonValue | null,
): Promise<number> {
  const raw = (settings as { totalPages?: number } | null)?.totalPages ?? 0
  const last = await tx.binderSlot.findFirst({
    where: { binderId },
    orderBy: { pageNumber: 'desc' },
    select: { pageNumber: true },
  })
  return Math.max(raw, last?.pageNumber ?? 0, 1)
}

/**
 * 以**指定格位為左上角**建立跨格群組（格位驅動加卡：SlotCardPicker / 複製格位）。
 * 矩形超出頁面邊界或任一格已被佔用時回 null，由呼叫端退回單格建立。
 *
 * 回傳 anchor 格位（已套 `slotDisplaySelect`），讓呼叫端沿用既有回應形狀。
 */
/**
 * 把一個既有的單格「就地展開」成跨格群組：**沿用原本那筆 BinderSlot 當 anchor**
 * （不刪除重建），其餘成員才新建。保留 anchor 的 row 身份讓前端不必 remount 該格，
 * 切換呈現方式時卡圖不會閃一下。
 *
 * 位置優先序：以原格為左上角 → 同頁其他矩形 → 其他頁；一律不新增頁（切換呈現方式
 * 不該讓卡冊長出新頁），全部放不下時回 null 由呼叫端回 409。
 */
export async function expandSlotToSpan(
  tx: Prisma.TransactionClient,
  params: {
    binderId: string
    slot: { id: string; pageNumber: number; slotIndex: number; cardId: string; displayCardId: string | null; status: CardStatus }
    layout: SpanLayout
    gridCols: number
    slotsPerPage: number
    totalPages: number
  },
) {
  const { binderId, slot, layout, gridCols, slotsPerPage, totalPages } = params

  const cells = await loadBinderCells(tx, binderId)
  // 自己那格會被 anchor 沿用，判定空間時不算佔用
  cells.occupied.delete(slotKey(slot.pageNumber, slot.slotIndex))

  const gridRows = Math.floor(slotsPerPage / gridCols)
  const baseRow = Math.floor(slot.slotIndex / gridCols)
  const baseCol = slot.slotIndex % gridCols

  let pageNumber = slot.pageNumber
  let slotIndices: number[] | null = null

  // 先試以原格為左上角，維持「原地展開」的直覺
  if (baseCol + layout.cols <= gridCols && baseRow + layout.rows <= gridRows) {
    const candidate = groupSlotIndices(slot.slotIndex, layout.cols, layout.rows, gridCols)
    if (candidate.every((i) => !cells.occupied.has(slotKey(slot.pageNumber, i)))) {
      slotIndices = candidate
    }
  }

  if (!slotIndices) {
    const placement = planGroupPlacement({
      occupied: cells.occupied,
      gridCols,
      slotsPerPage,
      totalPages,
      cols: layout.cols,
      rows: layout.rows,
      preferPage: slot.pageNumber,
    })
    if (placement.status !== 'placed' || placement.newPage) return null
    pageNumber = placement.pageNumber
    slotIndices = placement.slotIndices
  }

  const group = await tx.binderSlotGroup.create({
    data: { binderId, cols: layout.cols, rows: layout.rows, rotation: layout.rotation },
    select: { id: true },
  })

  const shared = {
    cardId: slot.cardId,
    displayCardId: slot.displayCardId,
    status: slot.status,
    groupId: group.id,
  }

  // anchor 先挪到不可能相撞的暫時座標，避免與其餘成員的目標位置撞 unique constraint
  await tx.binderSlot.update({
    where: { id: slot.id },
    data: { pageNumber: -1, slotIndex: -1 },
  })
  await tx.binderSlot.deleteMany({
    where: { binderId, pageNumber, slotIndex: { in: slotIndices }, cardId: null },
  })

  for (const [groupIndex, slotIndex] of slotIndices.entries()) {
    if (groupIndex === 0) {
      await tx.binderSlot.update({
        where: { id: slot.id },
        data: { pageNumber, slotIndex, ...shared, groupIndex },
      })
    } else {
      await tx.binderSlot.create({
        data: { binderId, pageNumber, slotIndex, ...shared, groupIndex },
      })
    }
  }

  return tx.binderSlot.findMany({
    where: { binderId, groupId: group.id },
    orderBy: { groupIndex: 'asc' },
    select: slotDisplaySelect,
  })
}

export async function placeSpanGroupAt(
  tx: Prisma.TransactionClient,
  params: {
    binderId: string
    cardId: string
    displayCardId: string | null
    status: CardStatus
    layout: SpanLayout
    gridCols: number
    slotsPerPage: number
    pageNumber: number
    slotIndex: number
  },
) {
  const { binderId, cardId, displayCardId, status, layout, gridCols, slotsPerPage } = params
  const baseCol = params.slotIndex % gridCols
  const gridRows = Math.floor(slotsPerPage / gridCols)
  const baseRow = Math.floor(params.slotIndex / gridCols)
  if (baseCol + layout.cols > gridCols || baseRow + layout.rows > gridRows) return null

  const slotIndices = groupSlotIndices(params.slotIndex, layout.cols, layout.rows, gridCols)
  const existing = await tx.binderSlot.findMany({
    where: { binderId, pageNumber: params.pageNumber, slotIndex: { in: slotIndices } },
    select: { id: true, slotIndex: true, cardId: true },
  })
  if (existing.some((row) => row.cardId)) return null
  const vacantByIndex = new Map(existing.map((row) => [row.slotIndex, row.id]))

  const group = await tx.binderSlotGroup.create({
    data: { binderId, cols: layout.cols, rows: layout.rows, rotation: layout.rotation },
    select: { id: true },
  })

  for (const [groupIndex, slotIndex] of slotIndices.entries()) {
    const data = { cardId, displayCardId, status, groupId: group.id, groupIndex }
    const vacantId = vacantByIndex.get(slotIndex)
    if (vacantId) await tx.binderSlot.update({ where: { id: vacantId }, data })
    else await tx.binderSlot.create({ data: { binderId, pageNumber: params.pageNumber, slotIndex, ...data } })
  }

  return tx.binderSlot.findUniqueOrThrow({
    where: {
      binderId_pageNumber_slotIndex: {
        binderId,
        pageNumber: params.pageNumber,
        slotIndex: slotIndices[0],
      },
    },
    select: slotDisplaySelect,
  })
}

/** 群組成員數 = cols × rows；用於容量估算與資料完整性檢查。 */
export function spanSlotCount(layout: SpanLayout): number {
  return layout.cols * layout.rows
}

/**
 * 查出某張卡的自然跨格佈局，並先以格線尺寸過濾——放不下的格線（如 grid_1x2 只有 1 欄）
 * 直接回 null，讓呼叫端走既有單格路徑，不必等到放置階段才回退。
 */
export async function loadSpanLayoutForCard(
  client: { card: { findUnique: Prisma.CardDelegate['findUnique'] } },
  cardId: string,
  gridCols: number,
  slotsPerPage: number,
): Promise<SpanLayout | null> {
  const card = await client.card.findUnique({
    where: { id: cardId },
    select: { cardNumber: true, supertype: true },
  })
  if (!card) return null
  return filterLayoutByGrid(resolveSpanLayout(card), gridCols, slotsPerPage)
}

/** 格線容不下該形狀時回 null（呼叫端退回單格）。 */
export function filterLayoutByGrid(
  layout: SpanLayout | null,
  gridCols: number,
  slotsPerPage: number,
): SpanLayout | null {
  if (!layout) return null
  const gridRows = Math.floor(slotsPerPage / gridCols)
  return layout.cols <= gridCols && layout.rows <= gridRows ? layout : null
}
