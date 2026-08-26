import { MAX_PAGES_PER_BINDER } from '@/lib/binder-limits'

export type SlotPosition = { pageNumber: number; slotIndex: number }

export type PlanSlotPlacementInput = {
  /** 依 (pageNumber asc, slotIndex asc) 排序、cardId 為 null 的空格 id 清單（已 take(needed)） */
  emptySlotIds: string[]
  /** binder 內目前最後一個格位（依 pageNumber desc, slotIndex desc），無格位則傳 null */
  lastSlot: SlotPosition | null
  slotsPerPage: number
  needed: number
}

export type PlanSlotPlacementResult = {
  /** 要直接填入卡牌的既有空格 id（依序對應待填清單前段） */
  fillSlotIds: string[]
  /** 需要新建的格位座標（依序對應待填清單後段） */
  newPositions: SlotPosition[]
  /** 若為 true，整批操作因超過 MAX_PAGES_PER_BINDER 而必須整批拒絕 */
  exceedsLimit: boolean
  /** 在不超過頁數上限的前提下，此卡冊當前還能再容納多少張卡（含既有空格） */
  remainingCapacity: number
}

/**
 * 純函式：計算「優先填空格、不足才新建格位」的配置結果，並判定是否超過
 * MAX_PAGES_PER_BINDER。單張與批次 route 共用，確保上限判定邏輯一致。
 */
export function planSlotPlacement({
  emptySlotIds,
  lastSlot,
  slotsPerPage,
  needed,
}: PlanSlotPlacementInput): PlanSlotPlacementResult {
  const maxAbsoluteIndex = MAX_PAGES_PER_BINDER * slotsPerPage - 1

  const lastAbsoluteIndex = lastSlot
    ? (lastSlot.pageNumber - 1) * slotsPerPage + lastSlot.slotIndex
    : -1

  const remainingNewSlotCapacity = Math.max(0, maxAbsoluteIndex - lastAbsoluteIndex)
  const remainingCapacity = emptySlotIds.length + remainingNewSlotCapacity

  const fillSlotIds = emptySlotIds.slice(0, needed)
  const slotsToCreate = needed - fillSlotIds.length

  const exceedsLimit = slotsToCreate > remainingNewSlotCapacity

  const newPositions: SlotPosition[] = []
  if (!exceedsLimit) {
    let nextAbsoluteIndex = lastAbsoluteIndex + 1
    for (let i = 0; i < slotsToCreate; i++) {
      newPositions.push({
        pageNumber: Math.floor(nextAbsoluteIndex / slotsPerPage) + 1,
        slotIndex: nextAbsoluteIndex % slotsPerPage,
      })
      nextAbsoluteIndex++
    }
  }

  return { fillSlotIds, newPositions, exceedsLimit, remainingCapacity }
}

// ── 跨格群組（BinderSlotGroup）的矩形放置 ────────────────────────────────────

/** occupied set 的 key 慣例。呼叫端與本檔共用，避免各自組字串而漂移。 */
export function slotKey(pageNumber: number, slotIndex: number): string {
  return `${pageNumber}:${slotIndex}`
}

/** 群組左上角所在的 slotIndex → 群組全部成員的 slotIndex（row-major，對應 groupIndex）。 */
export function groupSlotIndices(
  topLeftIndex: number,
  cols: number,
  rows: number,
  gridCols: number,
): number[] {
  const baseRow = Math.floor(topLeftIndex / gridCols)
  const baseCol = topLeftIndex % gridCols
  const indices: number[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      indices.push((baseRow + r) * gridCols + (baseCol + c))
    }
  }
  return indices
}

export type GroupPlacement = {
  pageNumber: number
  /** 依 groupIndex 排序的成員格位 index（[0] = 左上 = anchor） */
  slotIndices: number[]
  /** 是否放在既有頁數之外的新頁 */
  newPage: boolean
}

export type PlanGroupPlacementResult =
  | ({ status: 'placed' } & GroupPlacement)
  /** 此格線容不下該形狀（如 grid_1x2 只有 1 欄），呼叫端應退回單格 */
  | { status: 'unsupported' }
  /** 需要新頁但已達 MAX_PAGES_PER_BINDER，整組拒絕 */
  | { status: 'pageLimit' }

/**
 * 為跨格群組找一塊連續矩形空區：**同頁優先、頁碼由小到大**，找不到就往後開新頁放左上角。
 *
 * 與 `planSlotPlacement`（線性填空格）刻意分開：矩形搜尋不能用線性 index 表達，
 * 且「放不下就開新頁」會在前頁留下零星空格——這是決策上接受的代價。
 */
export function planGroupPlacement(input: {
  /** 已佔用格位，key 為 `slotKey()` */
  occupied: ReadonlySet<string>
  gridCols: number
  slotsPerPage: number
  /** 目前頁數（新頁從 totalPages + 1 起算） */
  totalPages: number
  cols: number
  rows: number
  /** 優先嘗試的頁碼（比照 findNextEmptySlot 的「同頁優先」慣例），其餘頁再依序遞補 */
  preferPage?: number
}): PlanGroupPlacementResult {
  const { occupied, gridCols, slotsPerPage, totalPages, cols, rows, preferPage } = input
  const gridRows = Math.floor(slotsPerPage / gridCols)

  if (cols > gridCols || rows > gridRows) return { status: 'unsupported' }

  const pageOrder =
    preferPage && preferPage >= 1 && preferPage <= totalPages
      ? [preferPage, ...Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p !== preferPage)]
      : Array.from({ length: totalPages }, (_, i) => i + 1)

  for (const page of pageOrder) {
    for (let r = 0; r + rows <= gridRows; r++) {
      for (let c = 0; c + cols <= gridCols; c++) {
        const indices = groupSlotIndices(r * gridCols + c, cols, rows, gridCols)
        if (indices.every((i) => !occupied.has(slotKey(page, i)))) {
          return { status: 'placed', pageNumber: page, slotIndices: indices, newPage: false }
        }
      }
    }
  }

  const newPageNumber = totalPages + 1
  if (newPageNumber > MAX_PAGES_PER_BINDER) return { status: 'pageLimit' }

  return {
    status: 'placed',
    pageNumber: newPageNumber,
    slotIndices: groupSlotIndices(0, cols, rows, gridCols),
    newPage: true,
  }
}

// ── 中途插入空格位（後續格位順延） ──────────────────────────────────────────

export type InsertionSlot = {
  id: string
  pageNumber: number
  slotIndex: number
  groupId: string | null
  groupIndex: number | null
}

export type InsertionGroup = { id: string; cols: number; rows: number }

export type PlanSlotInsertionInput = {
  /** 卡冊內所有已填卡格位（順序不拘） */
  slots: InsertionSlot[]
  groups: InsertionGroup[]
  gridCols: number
  slotsPerPage: number
  totalPages: number
  /**
   * 作用點。
   * - `planSlotInsertion`：此格與其後往後推（語意＝「在此格之前插入」）
   * - `planSlotRemoval`：此格必須是空格，其後的卡往前遞補填掉它
   */
  insertAt: SlotPosition
  /** 位移範圍內遇到跨格群組時的處理；未指定＝回報 blockedByGroup，交由呼叫端詢問使用者 */
  groupMode?: 'shift' | 'collapse'
}

/** 插入與移除共用同一份結果型別（兩者只是同一個位移的正反方向） */
export type PlanSlotShiftResult = PlanSlotInsertionResult

export type PlanSlotInsertionResult =
  /** 插入點本身已是空格，無需位移 */
  | { status: 'noop' }
  /** 位移範圍內有跨格群組且未指定 groupMode */
  | { status: 'blockedByGroup'; groupIds: string[] }
  /** 需要新頁但已達 MAX_PAGES_PER_BINDER */
  | { status: 'pageLimit' }
  | {
      status: 'planned'
      /** 只含位置真的改變的格位（比照 repackSlotsForGridChange 的慣例） */
      moves: { id: string; pageNumber: number; slotIndex: number }[]
      /** groupMode='collapse' 時被拆掉的群組（僅留 anchor） */
      collapsedGroupIds: string[]
      /** 拆組時要刪除的成員格位（anchor 以外）；理由同 repackSlotsForGridChange.removedSlotIds */
      removedSlotIds: string[]
      /** 位移後所需頁數（未增頁時等於輸入的 totalPages） */
      newTotalPages: number
    }

/** 一個位移單位：單格佔 1 個 cell，跨格群組整組佔 cols×rows 矩形。 */
type InsertionUnit = {
  /** 依 groupIndex 排序的成員 id（單格則只有一個） */
  slotIds: string[]
  /** 依 groupIndex 排序的成員目前絕對索引 */
  cells: number[]
  cols: number
  rows: number
  groupId: string | null
}

/**
 * 純函式：計算「在某格之前插入一個空格，其後格位順延」需要哪些位移。
 *
 * 格位是稀疏 row（空位在 DB 沒有 row），所以位移範圍是**有界**的——只需推到
 * 全卡冊第一個空位為止，不是整本重排。演算法把格位聚成 unit（單格／跨格群組），
 * 從插入點的下一格開始依序重新配置，某個 unit 的新位置＝原位置時即可提早停止。
 *
 * 全單格的情況會退化成單純的「各推一格」；跨格群組因為必須維持矩形，
 * 壓到列尾時會往後找到下一個合法矩形，可能一次推超過一格（接受的取捨，
 * 與 planGroupPlacement「放不下就開新頁、前頁留零星空格」一致）。
 */
function planSlotShift(
  {
    slots,
    groups,
    gridCols,
    slotsPerPage,
    totalPages,
    insertAt,
    groupMode,
  }: PlanSlotInsertionInput,
  direction: 'forward' | 'backward',
): PlanSlotShiftResult {
  const gridRows = Math.floor(slotsPerPage / gridCols)
  const toAbs = (pageNumber: number, slotIndex: number) =>
    (pageNumber - 1) * slotsPerPage + slotIndex
  const fromAbs = (abs: number) => ({
    pageNumber: Math.floor(abs / slotsPerPage) + 1,
    slotIndex: abs % slotsPerPage,
  })

  const anchorAbs = toAbs(insertAt.pageNumber, insertAt.slotIndex)
  const anchorOccupied = slots.some((s) => toAbs(s.pageNumber, s.slotIndex) === anchorAbs)
  // forward（插入）：作用點必須有卡才有東西可推；backward（移除空格）：必須是空格才有洞可填
  if (direction === 'forward' ? !anchorOccupied : anchorOccupied) {
    return { status: 'noop' }
  }

  // ── 聚成 unit ────────────────────────────────────────────────────────────
  const groupById = new Map(groups.map((g) => [g.id, g]))
  const membersByGroup = new Map<string, InsertionSlot[]>()
  const singles: InsertionSlot[] = []
  for (const slot of slots) {
    if (slot.groupId && groupById.has(slot.groupId)) {
      const list = membersByGroup.get(slot.groupId) ?? []
      list.push(slot)
      membersByGroup.set(slot.groupId, list)
    } else {
      singles.push(slot)
    }
  }
  for (const list of membersByGroup.values()) {
    list.sort((a, b) => (a.groupIndex ?? 0) - (b.groupIndex ?? 0))
  }

  const units: InsertionUnit[] = singles.map((s) => ({
    slotIds: [s.id],
    cells: [toAbs(s.pageNumber, s.slotIndex)],
    cols: 1,
    rows: 1,
    groupId: null,
  }))
  for (const [groupId, members] of membersByGroup) {
    const group = groupById.get(groupId)!
    units.push({
      slotIds: members.map((m) => m.id),
      cells: members.map((m) => toAbs(m.pageNumber, m.slotIndex)),
      cols: group.cols,
      rows: group.rows,
      groupId,
    })
  }

  // ── 分出位移範圍 ─────────────────────────────────────────────────────────
  const inRange: InsertionUnit[] = []
  const outOfRangeCells: number[] = []

  if (direction === 'forward') {
    // 作用點自己那格也要被往後推。範圍上界不必先算：配置迴圈的「新位置＝原位置即提早停止」
    // 會自然收斂到第一個空位。
    for (const unit of units) {
      if (unit.cells.some((c) => c >= anchorAbs)) inRange.push(unit)
      else outOfRangeCells.push(...unit.cells)
    }
  } else {
    // backward 必須**明確**掃出「作用點之後的連續佔用區段」——不能沿用 forward 的
    // 「≥ 作用點就算數」，否則配置迴圈會把區段之後（隔著空位）的卡也一併往前吸成緊密排列，
    // 那是重排、不是移除一格。掃描時遇到跨格群組要整組跳過（群組可能橫跨一個非成員空格）。
    const unitByCell = new Map<number, InsertionUnit>()
    for (const unit of units) for (const c of unit.cells) unitByCell.set(c, unit)

    const inRunIds = new Set<InsertionUnit>()
    let scan = anchorAbs + 1
    for (;;) {
      const unit = unitByCell.get(scan)
      if (!unit) break
      inRunIds.add(unit)
      scan = Math.max(...unit.cells) + 1
    }
    for (const unit of units) {
      if (inRunIds.has(unit)) inRange.push(unit)
      else outOfRangeCells.push(...unit.cells)
    }
    // 作用點之後緊接著就是空的：沒有東西可遞補
    if (inRange.length === 0) return { status: 'noop' }
  }

  const blockedGroupIds = inRange.filter((u) => u.groupId).map((u) => u.groupId!)
  if (blockedGroupIds.length > 0 && !groupMode) {
    return { status: 'blockedByGroup', groupIds: blockedGroupIds }
  }

  // collapse：範圍內的群組先收合成單格（只留 anchor），其餘成員刪除
  const collapsedGroupIds: string[] = []
  const removedSlotIds: string[] = []
  const pending = inRange.map((unit) => {
    if (unit.groupId && groupMode === 'collapse') {
      collapsedGroupIds.push(unit.groupId)
      removedSlotIds.push(...unit.slotIds.slice(1))
      return {
        slotIds: [unit.slotIds[0]],
        cells: [unit.cells[0]],
        cols: 1,
        rows: 1,
        groupId: null,
      } satisfies InsertionUnit
    }
    return unit
  })
  pending.sort((a, b) => a.cells[0] - b.cells[0])

  // ── 依序重新配置 ────────────────────────────────────────────────────────
  const allocated = new Set<number>(outOfRangeCells)
  // forward 要空出作用點那一格（不得被填回）；backward 的作用點正是要被填掉的洞
  if (direction === 'forward') allocated.add(anchorAbs)
  const maxAbs = MAX_PAGES_PER_BINDER * slotsPerPage - 1

  /** 群組以 anchor 為左上角時的成員 abs；不成矩形（跨列尾／跨頁）回 null。 */
  const rectCells = (anchor: number, cols: number, rows: number): number[] | null => {
    const page = Math.floor(anchor / slotsPerPage)
    const idx = anchor % slotsPerPage
    const row = Math.floor(idx / gridCols)
    const col = idx % gridCols
    if (col + cols > gridCols || row + rows > gridRows) return null
    return groupSlotIndices(idx, cols, rows, gridCols).map((i) => page * slotsPerPage + i)
  }

  const result: { id: string; pageNumber: number; slotIndex: number }[] = []

  let cursor = direction === 'forward' ? anchorAbs + 1 : anchorAbs
  let highest = Math.max(anchorAbs, ...outOfRangeCells, -1)

  for (const unit of pending) {
    let placement: number[] | null = null
    // forward：位移只會往後，絕不把後方的格位往前吸進空位（那是重排、不是插入）
    // backward：正是要往回移，故從 cursor 開始找（提早停止條件保證不會超過原位置）
    let anchor = direction === 'forward' ? Math.max(cursor, unit.cells[0]) : cursor
    while (anchor <= maxAbs) {
      if (unit.cols === 1 && unit.rows === 1) {
        if (!allocated.has(anchor)) placement = [anchor]
      } else {
        const cells = rectCells(anchor, unit.cols, unit.rows)
        if (cells && cells.every((c) => !allocated.has(c))) placement = cells
      }
      if (placement) break
      anchor++
    }
    if (!placement) return { status: 'pageLimit' }

    // 提早停止：這個 unit 沒動，其後的 unit 也不會被推到
    if (placement[0] === unit.cells[0]) break

    placement.forEach((cell, i) => {
      allocated.add(cell)
      const pos = fromAbs(cell)
      result.push({ id: unit.slotIds[i], pageNumber: pos.pageNumber, slotIndex: pos.slotIndex })
      if (cell > highest) highest = cell
    })
    cursor = placement[0] + 1
    while (allocated.has(cursor)) cursor++
  }

  // backward 只會把卡往前拉，永遠不需要新頁；也刻意不自動刪頁（頁面刪除只能明確執行）
  const newTotalPages =
    direction === 'backward'
      ? totalPages
      : Math.max(totalPages, Math.floor(highest / slotsPerPage) + 1)
  if (newTotalPages > MAX_PAGES_PER_BINDER) return { status: 'pageLimit' }

  const original = new Map(slots.map((s) => [s.id, s]))
  const moves = result.filter((m) => {
    const before = original.get(m.id)!
    return before.pageNumber !== m.pageNumber || before.slotIndex !== m.slotIndex
  })

  // 沒有任何格位真的會動（例：空格前是個跨格群組，往回移會讓矩形跨列而動不了）
  // → 回 noop，讓呼叫端提示而不是丟出一個什麼都沒改變的成功訊息
  if (moves.length === 0 && removedSlotIds.length === 0) return { status: 'noop' }

  return {
    status: 'planned',
    moves,
    collapsedGroupIds,
    removedSlotIds,
    newTotalPages,
  }
}

/**
 * 在指定格位「之前」插入一個空格，其後的格位往後順延。詳見 `planSlotShift`。
 */
export function planSlotInsertion(input: PlanSlotInsertionInput): PlanSlotShiftResult {
  return planSlotShift(input, 'forward')
}

/**
 * 移除指定的**空格**，其後的格位往前遞補填掉它——與 `planSlotInsertion` 互為反向操作。
 *
 * 位移範圍同樣有界：拉到下一個空位為止。不增頁、也不自動刪頁（尾端可能留下全空的頁面，
 * 頁面刪除依既有決策只能在內頁管理明確執行）。
 */
export function planSlotRemoval(input: PlanSlotInsertionInput): PlanSlotShiftResult {
  return planSlotShift(input, 'backward')
}
