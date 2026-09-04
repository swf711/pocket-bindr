'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { GridType, CardStatus } from '@prisma/client'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { BinderSpreadView } from './binder-spread-view'
import { BinderMobileView } from './binder-mobile-view'
import { BinderSettingsDrawer } from './binder-settings-drawer'
import { PageManagerDialog } from './page-manager-dialog'
import { SlotCardPickerDialog } from './slot-card-picker-dialog'
import { InsertSlotGroupDialog } from './insert-slot-group-dialog'
import { SlotLabelDialog } from './slot-label-dialog'
import { CardDetailDrawer } from '@/components/cards/card-detail-drawer'
import { IconTooltipButton } from '@/components/common/icon-tooltip-button'
import type { BinderDetailResponse, SlotWithCard, SlotCardResult } from '@/types/binder'
import type { CardWithCollectionStatus } from '@/types/card'
import { buildGridPages, buildSpreads, buildMobilePages, pageNumberToSpreadIndex, findNextEmptySlot } from '@/lib/binder-utils'
import { GRID_TYPE_COLS, GRID_TYPE_SLOTS } from '@/types/binder'
import { groupSlotIndices, planSlotInsertion, planSlotRemoval } from '@/lib/binder-slot-placement'
import type { InsertionGroup, InsertionSlot } from '@/lib/binder-slot-placement'
import { resolveSpanLayout } from '@/lib/multi-card-layout'
import { isMultiNumberCard } from '@/lib/card-number'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { useSwapSlots } from '@/hooks/use-swap-slots'
import { useAddToBinder } from '@/hooks/use-add-to-binder'

const OPTIMISTIC_SLOT_PREFIX = 'optimistic-span-'

export function BinderView({ binder }: { binder: BinderDetailResponse }) {
  const t = useTranslations('binder')
  const [slots, setSlots] = useState<SlotWithCard[]>(binder.slots)
  const [spreadIndex, setSpreadIndex] = useState(0)
  const [mobilePageIndex, setMobilePageIndex] = useState(0)
  const [totalPages, setTotalPages] = useState(binder.settings?.totalPages ?? 1)
  const [binderName, setBinderName] = useState(binder.name)
  const [binderGridType, setBInderGridType] = useState<GridType>(binder.gridType as GridType)
  const [binderCoverColor, setBinderCoverColor] = useState(binder.coverColor)
  const [binderDescription, setBinderDescription] = useState(binder.description)
  const [shareToken, setShareToken] = useState<string | null>(binder.shareToken)
  const [pickerTarget, setPickerTarget] = useState<{ pageNumber: number; slotIndex: number } | null>(null)
  const [viewCard, setViewCard] = useState<CardWithCollectionStatus | null>(null)
  const [highlightedSlotId, setHighlightedSlotId] = useState<string | null>(null)
  // 剛展開的跨格群組：讓新出現的格位播放一次進場動畫，而不是每次載入頁面都動
  const [expandingGroupId, setExpandingGroupId] = useState<string | null>(null)
  const expandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  // 正在編輯標籤的格位（跨格群組一律是 anchor）
  const [labelTargetId, setLabelTargetId] = useState<string | null>(null)
  // 插入／移除空格撞到跨格群組時，先問使用者要整組一起移動還是先收合
  const [insertPrompt, setInsertPrompt] = useState<{
    mode: 'insert' | 'remove'
    at: { pageNumber: number; slotIndex: number }
    groupCount: number
  } | null>(null)
  // 位移飛行中：擋住重入（樂觀更新後畫面已變、DB 尚未寫完）
  const [isShifting, setIsShifting] = useState(false)
  const isShiftingRef = useRef(false)
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMobile = useIsMobile()
  const swapSlots = useSwapSlots()
  const addToBinder = useAddToBinder()

  const gridType = binderGridType
  const pages = buildGridPages(slots, gridType, totalPages)
  const pagesArray = Array.from({ length: totalPages }, (_, i) => pages.get(i + 1) ?? [])
  const spreads = buildSpreads(pagesArray)
  const mobilePages = buildMobilePages(pagesArray)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      if (viewCard !== null || pickerTarget !== null) return

      const active = document.activeElement as HTMLElement | null
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return
      if (active?.closest('[role="dialog"]')) return

      const delta = e.key === 'ArrowLeft' ? -1 : 1
      if (isMobile) {
        setMobilePageIndex((prev) => Math.min(Math.max(prev + delta, 0), mobilePages.length - 1))
      } else {
        setSpreadIndex((prev) => Math.min(Math.max(prev + delta, 0), spreads.length - 1))
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isMobile, viewCard, pickerTarget, spreads.length, mobilePages.length])

  const handleDelete = async (slotId: string) => {
    const res = await fetch(`/api/binders/${binder.id}/slots/${slotId}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error(t('deleteSlotFailed'))
      return
    }
    // 跨格群組刪任一格＝刪整組，後端回傳實際被移除的格位 id
    const data = (await res.json()) as { removedSlotIds?: string[] }
    const removed = new Set(data.removedSlotIds ?? [slotId])
    setSlots((prev) => prev.filter((s) => !removed.has(s.id)))
  }

  const handleSwap = (slotAId: string, slotBId: string) => {
    const slotA = slots.find((s) => s.id === slotAId)
    const slotB = slots.find((s) => s.id === slotBId)
    if (!slotA || !slotB) return

    // 拖曳跨格群組時掠過自己的成員格位＝小幅位移，當成移動處理（後端排除自身成員判定佔用）
    if (slotA.span && slotB.span && slotA.span.groupId === slotB.span.groupId) {
      void handleMove(slotAId, slotB.pageNumber, slotB.slotIndex)
      return
    }
    // 其餘情況：跨格群組只能整組落在全空矩形，不支援與單格互換（見核心設計決策）
    if (slotA.span || slotB.span) {
      toast.error(t('spanTargetOccupied'))
      return
    }

    // optimistic local update
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id === slotAId) return { ...s, pageNumber: slotB.pageNumber, slotIndex: slotB.slotIndex }
        if (s.id === slotBId) return { ...s, pageNumber: slotA.pageNumber, slotIndex: slotA.slotIndex }
        return s
      }),
    )

    swapSlots.mutate(
      { binderId: binder.id, slotAId, slotBId },
      {
        onError: () => {
          // rollback local state
          setSlots((prev) =>
            prev.map((s) => {
              if (s.id === slotAId)
                return { ...s, pageNumber: slotA.pageNumber, slotIndex: slotA.slotIndex }
              if (s.id === slotBId)
                return { ...s, pageNumber: slotB.pageNumber, slotIndex: slotB.slotIndex }
              return s
            }),
          )
          toast.error(t('swapSlotFailed'))
        },
      },
    )
  }

  const handleToggleStatus = async (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId)
    if (!slot) return
    const newStatus = slot.status === 'owned' ? 'wanted' : 'owned'
    // 跨格群組是同一張實體卡的多個區塊，狀態整組連動
    const groupId = slot.span?.groupId
    const affects = (s: SlotWithCard) => (groupId ? s.span?.groupId === groupId : s.id === slotId)

    setSlots((prev) => prev.map((s) => (affects(s) ? { ...s, status: newStatus } : s)))
    const res = await fetch(`/api/binders/${binder.id}/slots/${slotId}/status`, { method: 'PATCH' })
    if (!res.ok) {
      setSlots((prev) => prev.map((s) => (affects(s) ? { ...s, status: slot.status } : s)))
      toast.error(t('toggleStatusFailed'))
    }
  }

  /**
   * 整組搬移跨格群組。`slotIndex` 是群組的**左上角**位置，目標矩形必須全空，否則後端回 409。
   *
   * 與單格移動一樣採**樂觀更新**：格位先就位、失敗才回滾。少了這一步，放開滑鼠後拖曳幽靈消失、
   * 格位卻要等 API round-trip 才移動，視覺上會先彈回原位再跳到目標，與單格拖曳手感不一致。
   */
  const handleMoveGroup = async (groupId: string, pageNumber: number, slotIndex: number) => {
    const members = slots
      .filter((s) => s.span?.groupId === groupId)
      .sort((a, b) => (a.span!.groupIndex ?? 0) - (b.span!.groupIndex ?? 0))
    if (members.length === 0) return

    const span = members[0].span!
    const targetIndices = groupSlotIndices(
      slotIndex,
      span.cols,
      span.rows,
      GRID_TYPE_COLS[gridType],
    )
    // 目標矩形若已有別的卡片，**在樂觀更新之前**就擋下——否則會先蓋過去、等 409 回來才退回，
    // 使用者會看到卡片閃到目標位置又跳回原位。
    const memberIds = new Set(members.map((m) => m.id))
    const blocked = slots.some(
      (s) =>
        !memberIds.has(s.id) &&
        s.pageNumber === pageNumber &&
        targetIndices.includes(s.slotIndex),
    )
    if (blocked) {
      toast.error(t('spanTargetOccupied'))
      return
    }

    const nextById = new Map(
      members.map((m, i) => [m.id, { pageNumber, slotIndex: targetIndices[i] }]),
    )
    const prevById = new Map(
      members.map((m) => [m.id, { pageNumber: m.pageNumber, slotIndex: m.slotIndex }]),
    )
    const applyPositions = (positions: Map<string, { pageNumber: number; slotIndex: number }>) =>
      setSlots((prev) => prev.map((s) => ({ ...s, ...(positions.get(s.id) ?? {}) })))

    applyPositions(nextById)

    const res = await fetch(`/api/binders/${binder.id}/slots/group/${groupId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageNumber, slotIndex }),
    })
    if (!res.ok) {
      applyPositions(prevById)
      toast.error(res.status === 409 ? t('spanTargetOccupied') : t('spanMoveFailed'))
    }
  }

  const handleMove = async (slotId: string, pageNumber: number, slotIndex: number) => {
    const slot = slots.find((s) => s.id === slotId)
    if (!slot) return
    if (slot.span) {
      // 落點依「抓住的是群組哪一格」反推左上角，與拖曳幽靈顯示的佔用範圍一致；
      // 抓右下角拖曳時整組往左上延伸，而不是從游標往右下長出去。
      const span = slot.span
      const gridCols = GRID_TYPE_COLS[gridType]
      const gridRows = Math.floor(GRID_TYPE_SLOTS[gridType] / gridCols)
      const topRow = Math.floor(slotIndex / gridCols) - Math.floor(span.groupIndex / span.cols)
      const topCol = (slotIndex % gridCols) - (span.groupIndex % span.cols)
      if (
        topRow < 0 ||
        topCol < 0 ||
        topCol + span.cols > gridCols ||
        topRow + span.rows > gridRows
      ) {
        toast.error(t('spanTargetOutOfBounds'))
        return
      }
      await handleMoveGroup(span.groupId, pageNumber, topRow * gridCols + topCol)
      return
    }
    const prevPage = slot.pageNumber
    const prevIndex = slot.slotIndex
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, pageNumber, slotIndex } : s)),
    )
    const res = await fetch(`/api/binders/${binder.id}/slots/${slotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageNumber, slotIndex }),
    })
    if (!res.ok) {
      setSlots((prev) =>
        prev.map((s) =>
          s.id === slotId ? { ...s, pageNumber: prevPage, slotIndex: prevIndex } : s,
        ),
      )
      toast.error(t('moveSlotFailed'))
    }
  }

  const handleAddPage = async () => {
    const res = await fetch(`/api/binders/${binder.id}/pages`, { method: 'POST' })
    if (res.status === 409) {
      toast.error(t('pageMax'))
      return
    }
    if (res.ok) {
      const data = await res.json()
      setTotalPages(data.totalPages)
      toast.success(t('pageAdded'))
    }
  }

  const handlePageDelete = (pageNumber: number, newSlots: SlotWithCard[]) => {
    setSlots(newSlots)
    setSpreadIndex((prev) => {
      const newSpreadCount = buildSpreads(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          buildGridPages(newSlots, gridType, totalPages - 1).get(i + 1) ?? [],
        ),
      ).length
      return Math.min(prev, Math.max(newSpreadCount - 1, 0))
    })
    setMobilePageIndex((prev) => Math.min(prev, totalPages - 1))
  }

  const handlePageReorder = (newSlots: SlotWithCard[]) => {
    setSlots(newSlots)
  }

  const handleSettingsUpdate = (updated: {
    name: string
    gridType: GridType
    coverColor: string
    description?: string | null
    newSlots?: SlotWithCard[]
    newTotalPages?: number
  }) => {
    setBinderName(updated.name)
    setBInderGridType(updated.gridType)
    setBinderCoverColor(updated.coverColor)
    if (updated.description !== undefined) setBinderDescription(updated.description)
    if (updated.newSlots !== undefined) setSlots(updated.newSlots)
    if (updated.newTotalPages !== undefined) setTotalPages(updated.newTotalPages)
  }

  const handleAddCard = (pageNumber: number, slotIndex: number) => {
    setPickerTarget({ pageNumber, slotIndex })
  }

  const handleConfirmAddCard = async (cardId: string, status: CardStatus) => {
    if (!pickerTarget) return
    const res = await fetch(`/api/binders/${binder.id}/slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...pickerTarget, cardId, status }),
    })
    if (!res.ok) {
      // Show a localized message rather than the raw (English) API error text.
      toast.error(t('addCardFailed'))
      return
    }
    const result: SlotCardResult = await res.json()
    // 複數卡可能被建成跨格群組（後端只回 anchor），無法用單一格位拼出本地狀態 → 重抓
    if (isMultiNumberCard(result.slot.card.cardNumber)) {
      await reloadSlots()
    } else {
      setSlots((prev) => [
        ...prev,
        {
          id: result.slot.id,
          binderId: binder.id,
          cardId: result.userCard.cardId,
          pageNumber: result.slot.pageNumber,
          slotIndex: result.slot.slotIndex,
          status: result.slot.status,
          card: result.slot.card,
        },
      ])
    }
    setPickerTarget(null)
    toast.success(t('addedCard'))
  }

  const handleAddToBinderFromDrawer = async (
    binderId: string,
    status: CardStatus,
    quantity: number,
  ) => {
    if (!viewCard) return
    const result = await addToBinder.mutateAsync({ card: viewCard, binderId, status, quantity })
    // 加入「此卡冊」（正在看的卡冊）→ 立即重抓格位反映新增；GET 不回 totalPages，故用 POST 回傳值
    if (binderId === binder.id) {
      if (result.updatedTotalPages) setTotalPages(result.updatedTotalPages)
      const res = await fetch(`/api/binders/${binder.id}`)
      if (res.ok) {
        const data = await res.json()
        setSlots(data.slots)
      }
    }
  }

  /** 重抓格位與頁數（手動重整、跨格切換等會一次動到多個 row 的操作共用）。 */
  const reloadSlots = async (): Promise<boolean> => {
      const res = await fetch(`/api/binders/${binder.id}`)
      if (!res.ok) return false
      const data = await res.json()
      const newTotalPages: number = typeof data.totalPages === 'number' ? data.totalPages : totalPages
      const newSlots: SlotWithCard[] = data.slots
      setSlots(newSlots)
      setTotalPages(newTotalPages)

      // 頁數縮減時 clamp 翻頁 index，但保留當前頁面（不重設為 0）
      const newPages = buildGridPages(newSlots, gridType, newTotalPages)
      const newPagesArray = Array.from({ length: newTotalPages }, (_, i) => newPages.get(i + 1) ?? [])
      const newSpreadsLength = buildSpreads(newPagesArray).length
      const newMobilePagesLength = buildMobilePages(newPagesArray).length
      setSpreadIndex((prev) => Math.min(prev, Math.max(newSpreadsLength - 1, 0)))
      setMobilePageIndex((prev) => Math.min(prev, Math.max(newMobilePagesLength - 1, 0)))
      return true
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      if (!(await reloadSlots())) toast.error(t('refreshFailed'))
    } catch {
      toast.error(t('refreshFailed'))
    } finally {
      setIsRefreshing(false)
    }
  }

  /**
   * 複數卡切換「跨格 ↔ 單格」。
   *
   * 兩種方向都做**樂觀更新**——收合是純刪除、展開的落點以與後端相同的純函式
   * （`resolveSpanLayout` + `groupSlotIndices`）在前端先算一次，故都能立即反映。
   * 失敗一律 `reloadSlots()` 把真相抓回來，不留下前端自行拼湊的殘影。
   */
  const handleToggleSpan = async (slotId: string, mode: 'span' | 'single') => {
    const slot = slots.find((s) => s.id === slotId)
    if (!slot) return
    const snapshot = slots

    // 是否已為這次切換播過進場動畫（不可用 expandingGroupId 是否為 null 判斷——
    // 動畫 400ms 後就會解除，而 API round-trip 通常更久，那樣必定重播一次）
    let animated = false

    if (mode === 'single' && slot.span) {
      const groupId = slot.span.groupId
      setSlots((prev) =>
        prev
          .filter((s) => s.span?.groupId !== groupId || s.span.groupIndex === 0)
          .map((s) => (s.span?.groupId === groupId ? { ...s, span: null } : s)),
      )
    } else if (mode === 'span' && !slot.span) {
      const predicted = predictSpanExpansion(slot)
      if (predicted) {
        setSlots((prev) => [...prev.filter((s) => s.id !== slotId), ...predicted])
        markExpanding(predicted[0].span!.groupId)
        animated = true
      }
    }

    const res = await fetch(`/api/binders/${binder.id}/slots/${slotId}/layout`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    })
    if (!res.ok) {
      setSlots(snapshot)
      const data = await res.json().catch(() => ({}))
      toast.error(data?.error === 'noRoomForSpan' ? t('spanNoRoom') : t('spanToggleFailed'))
      return
    }
    const data = (await res.json()) as { slots?: SlotWithCard[] }
    // 展開：以伺服器回傳的真實成員取代樂觀版本（anchor 沿用原 row，故不會 remount）
    if (data.slots) {
      const realIds = new Set(data.slots.map((m) => m.id))
      setSlots((prev) => [
        ...prev.filter((s) => !realIds.has(s.id) && !s.id.startsWith(OPTIMISTIC_SLOT_PREFIX)),
        ...data.slots!,
      ])
      // 樂觀預測不到落點時（需換頁等）此時才首次出現，補放動畫
      const realGroupId = data.slots[0]?.span?.groupId
      if (realGroupId && !animated) markExpanding(realGroupId)
    }
  }

  /** 標記某群組正在展開，短暫套用進場動畫後自動解除。 */
  const markExpanding = (groupId: string) => {
    if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current)
    setExpandingGroupId(groupId)
    expandTimeoutRef.current = setTimeout(() => setExpandingGroupId(null), 400)
  }

  /**
   * 前端預測「單格 → 跨格」的落點，讓切換立即反映而不必等 round-trip。
   * 與後端 `expandSlotToSpan` 同一套規則：以原格為左上角優先，否則同頁找矩形空區。
   * 預測不到（需要換頁或放不下）就不做樂觀更新，交給伺服器回應。
   */
  const predictSpanExpansion = (slot: SlotWithCard): SlotWithCard[] | null => {
    const layout = resolveSpanLayout(slot.card)
    if (!layout) return null
    const gridCols = GRID_TYPE_COLS[gridType]
    const gridRows = Math.floor(GRID_TYPE_SLOTS[gridType] / gridCols)
    if (layout.cols > gridCols || layout.rows > gridRows) return null

    const baseRow = Math.floor(slot.slotIndex / gridCols)
    const baseCol = slot.slotIndex % gridCols
    if (baseCol + layout.cols > gridCols || baseRow + layout.rows > gridRows) return null

    const indices = groupSlotIndices(slot.slotIndex, layout.cols, layout.rows, gridCols)
    const occupied = new Set(
      slots
        .filter((s) => s.pageNumber === slot.pageNumber && s.id !== slot.id)
        .map((s) => s.slotIndex),
    )
    if (indices.some((i) => occupied.has(i))) return null

    const groupId = `${OPTIMISTIC_SLOT_PREFIX}${slot.id}`
    return indices.map((slotIndex, groupIndex) => ({
      ...slot,
      id: groupIndex === 0 ? slot.id : `${OPTIMISTIC_SLOT_PREFIX}${slot.id}-${groupIndex}`,
      slotIndex,
      span: {
        groupId,
        groupIndex,
        cols: layout.cols,
        rows: layout.rows,
        rotation: layout.rotation,
        imageUrl: null,
      },
    }))
  }


  /**
   * 在某格「之前」插入一個空格，其後格位順延到全卡冊第一個空位為止。
   *
   * 先在 client 以與後端相同的純函式 `planSlotInsertion` 算一次——不是為了樂觀更新
   * （成功後仍走 reloadSlots()），而是為了在**打 API 之前**就知道要不要先問使用者
   * 「位移範圍撞到跨格群組怎麼辦」。後端仍以自己讀到的資料重算並驗證。
   */
  /**
   * 插入／移除空格共用的位移執行流程。
   *
   * client 端先用與後端**完全相同**的純函式算出 `moves`，一是為了在打 API 之前就知道
   * 要不要先問使用者「位移範圍撞到跨格群組怎麼辦」，二是直接拿來做**樂觀更新**——
   * 位移範圍可達整本卡冊，等 API 來回再重抓會有明顯延遲（實測「點下去像沒反應」的另一半成因，
   * 另一半是後端逐格 UPDATE，已改為批次 SQL）。
   *
   * 🔴 飛行中必須擋重入：樂觀更新後畫面已是新狀態，但 DB 還沒寫完；此時再點一次，
   * server 會從尚未更新的 DB 重算 → 兩次寫入互相打架。
   */
  const runSlotShift = async (
    mode: 'insert' | 'remove',
    at: { pageNumber: number; slotIndex: number },
    groupMode?: 'shift' | 'collapse',
  ) => {
    if (isShiftingRef.current) return
    const isInsert = mode === 'insert'

    const insertionSlots: InsertionSlot[] = slots.map((s) => ({
      id: s.id,
      pageNumber: s.pageNumber,
      slotIndex: s.slotIndex,
      groupId: s.span?.groupId ?? null,
      groupIndex: s.span?.groupIndex ?? null,
    }))
    const groupMap = new Map<string, InsertionGroup>()
    for (const s of slots) {
      if (s.span) groupMap.set(s.span.groupId, { id: s.span.groupId, cols: s.span.cols, rows: s.span.rows })
    }

    const planner = isInsert ? planSlotInsertion : planSlotRemoval
    const plan = planner({
      slots: insertionSlots,
      groups: [...groupMap.values()],
      gridCols: GRID_TYPE_COLS[gridType],
      slotsPerPage: GRID_TYPE_SLOTS[gridType],
      totalPages,
      insertAt: at,
      groupMode,
    })

    if (plan.status === 'noop') {
      toast.info(isInsert ? t('insertSlotAlreadyEmpty') : t('removeSlotNothingToPull'))
      return
    }
    if (plan.status === 'pageLimit') {
      toast.error(t('pageMax'))
      return
    }
    if (plan.status === 'blockedByGroup') {
      setInsertPrompt({ mode, at, groupCount: new Set(plan.groupIds).size })
      return
    }

    // ── 樂觀更新 ──────────────────────────────────────────────────────────
    const snapshotSlots = slots
    const snapshotTotalPages = totalPages
    const nextById = new Map(plan.moves.map((m) => [m.id, m]))
    const removed = new Set(plan.removedSlotIds)
    const collapsed = new Set(plan.collapsedGroupIds)

    setSlots((prev) =>
      prev
        .filter((s) => !removed.has(s.id))
        .map((s) => ({
          ...s,
          ...(nextById.get(s.id) ?? {}),
          // 收合的群組：留下的 anchor 退回單格呈現
          ...(s.span && collapsed.has(s.span.groupId) ? { span: null } : {}),
        })),
    )
    setTotalPages(plan.newTotalPages)

    /**
     * 位移失敗的統一善後：把樂觀更新的畫面還原，再重抓一次真相。
     * 🔴 樂觀更新後**任何**失敗路徑都必須經過這裡——包含 fetch 自己拋例外（斷網／請求被中止）。
     * 少了那條路徑，畫面會停在「看起來成功」的狀態，但 DB 根本沒寫。
     */
    const rollback = async (message: string) => {
      setSlots(snapshotSlots)
      setTotalPages(snapshotTotalPages)
      toast.error(message)
      await reloadSlots().catch(() => {})
    }
    const failedMessage = isInsert ? t('insertSlotFailed') : t('removeSlotFailed')

    isShiftingRef.current = true
    setIsShifting(true)
    try {
      const endpoint = isInsert ? 'insert' : 'remove-empty'
      let res: Response
      try {
        res = await fetch(`/api/binders/${binder.id}/slots/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...at, ...(groupMode ? { groupMode } : {}) }),
        })
      } catch {
        // 連線層面就失敗（斷網等）：沒有 response 可判讀，一律回滾
        await rollback(failedMessage)
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        await rollback(data?.error === 'pageLimitReached' ? t('pageMax') : failedMessage)
        return
      }
      const data = (await res.json()) as { movedSlotIds?: string[] }
      // 前後端同一純函式、同一輸入 → 結果應完全一致；不一致代表 client 的 slots 已過期
      // （例：另一分頁改過同一本卡冊），此時靜默重抓真相，不再多打一次全量 GET。
      if ((data.movedSlotIds?.length ?? 0) !== plan.moves.length) {
        await reloadSlots().catch(() => {})
      }
      toast.success(isInsert ? t('insertSlotSuccess') : t('removeSlotSuccess'))
    } finally {
      isShiftingRef.current = false
      setIsShifting(false)
    }
  }

  const handleEditLabel = (slotId: string) => setLabelTargetId(slotId)

  /**
   * 寫入／清除格位標籤。樂觀更新 + 失敗回滾，形狀比照 handleToggleStatus。
   * 後端對群組成員會改寫 anchor 並回傳 anchor 的 slotId，故成功後以回傳值為準再對齊一次。
   */
  const handleSaveLabel = async (labels: string[]) => {
    const slotId = labelTargetId
    if (!slotId) return
    const slot = slots.find((s) => s.id === slotId)
    if (!slot) return
    const previous = slot.labels ?? []

    setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, labels } : s)))
    try {
      const res = await fetch(`/api/binders/${binder.id}/slots/${slotId}/labels`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labels }),
      })
      if (!res.ok) throw new Error('failed')
      const data: { slotId: string; labels: string[] } = await res.json()
      if (data.slotId !== slotId) {
        setSlots((prev) =>
          prev.map((s) =>
            s.id === slotId
              ? { ...s, labels: previous }
              : s.id === data.slotId
                ? { ...s, labels: data.labels }
                : s,
          ),
        )
      }
      toast.success(t('labelUpdated'))
    } catch {
      setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, labels: previous } : s)))
      toast.error(t('labelUpdateFailed'))
    }
  }

  const handleInsertSlot = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId)
    if (!slot) return
    void runSlotShift('insert', { pageNumber: slot.pageNumber, slotIndex: slot.slotIndex })
  }

  const handleRemoveEmptySlot = (pageNumber: number, slotIndex: number) => {
    void runSlotShift('remove', { pageNumber, slotIndex })
  }

  const handleViewCard = async (cardId: string) => {
    const res = await fetch(`/api/cards/${cardId}`)
    if (!res.ok) {
      toast.error(t('loadCardFailed'))
      return
    }
    setViewCard(await res.json())
  }

  /** 從「管理內頁」Dialog 跳到指定頁；mobilePages[0] 是封面，故 page N 即 index N。 */
  const handleJumpToPage = (pageNumber: number) => {
    if (isMobile) {
      setMobilePageIndex(pageNumber)
    } else {
      setSpreadIndex(pageNumberToSpreadIndex(pageNumber))
    }
  }

  const handleJumpToSlot = (slot: SlotWithCard) => {
    if (isMobile) {
      setMobilePageIndex(slot.pageNumber)
    } else {
      setSpreadIndex(pageNumberToSpreadIndex(slot.pageNumber))
    }

    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current)
    setHighlightedSlotId(slot.id)
    highlightTimeoutRef.current = setTimeout(() => setHighlightedSlotId(null), 2000)

    requestAnimationFrame(() => {
      document
        .querySelector(`[data-testid="slot-card-${slot.id}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const handleCopyCard = async (slotId: string) => {
    const src = slots.find((s) => s.id === slotId)
    if (!src) return

    // 同頁優先找下一個空格；全卡冊皆滿則自動新增一頁
    let target = findNextEmptySlot(pages, totalPages, src.pageNumber)
    if (!target) {
      const pageRes = await fetch(`/api/binders/${binder.id}/pages`, { method: 'POST' })
      if (pageRes.status === 409) {
        toast.error(t('pageMax'))
        return
      }
      if (!pageRes.ok) {
        toast.error(t('copyCardFailed'))
        return
      }
      const data = await pageRes.json()
      setTotalPages(data.totalPages)
      target = { pageNumber: data.totalPages, slotIndex: 0 }
    }

    const res = await fetch(`/api/binders/${binder.id}/slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...target, cardId: src.cardId, status: src.status }),
    })
    if (!res.ok) {
      // Show a localized message rather than the raw (English) API error text.
      toast.error(t('copyCardFailed'))
      return
    }
    const result: SlotCardResult = await res.json()
    const newSlot: SlotWithCard = {
      id: result.slot.id,
      binderId: binder.id,
      cardId: result.userCard.cardId,
      pageNumber: result.slot.pageNumber,
      slotIndex: result.slot.slotIndex,
      status: result.slot.status,
      card: result.slot.card,
    }
    // 複製複數卡時後端可能建成跨格群組（只回 anchor）→ 重抓才拿得到完整成員
    if (isMultiNumberCard(result.slot.card.cardNumber)) {
      await reloadSlots()
    } else {
      setSlots((prev) => [...prev, newSlot])
    }
    handleJumpToSlot(newSlot)
    toast.success(t('copiedCard'))
  }

  const sharedHandlers = {
    onDelete: handleDelete,
    onSwap: handleSwap,
    onToggleStatus: handleToggleStatus,
    onMove: handleMove,
    onAddCard: handleAddCard,
    onView: handleViewCard,
    onCopy: handleCopyCard,
    onToggleSpan: handleToggleSpan,
    onInsertSlot: isShifting ? undefined : handleInsertSlot,
    onEditLabel: handleEditLabel,
    onRemoveSlot: isShifting ? undefined : handleRemoveEmptySlot,
    highlightedSlotId,
    expandingGroupId,
  }

  const refreshButton = (
    <IconTooltipButton
      data-testid="binder-refresh-btn"
      variant="outline"
      size="icon-lg"
      onClick={handleRefresh}
      disabled={isRefreshing}
      tooltip={t('refresh')}
    >
      {/* size-5 = M3 --m3-icon(20px)，與同排的管理內頁／設定齒輪一致 */}
      <RefreshCw className={`size-5${isRefreshing ? ' animate-spin' : ''}`} />
    </IconTooltipButton>
  )

  const settingsDrawer = (
    <BinderSettingsDrawer
      binderId={binder.id}
      binderName={binderName}
      binderDescription={binderDescription}
      gridType={binderGridType}
      coverColor={binderCoverColor}
      totalPages={totalPages}
      shareToken={shareToken}
      onSettingsUpdate={handleSettingsUpdate}
      onShareTokenChange={setShareToken}
    />
  )

  const pageManagerDialog = (
    <PageManagerDialog
      binderId={binder.id}
      gridType={gridType}
      totalPages={totalPages}
      slots={slots}
      onPageDelete={handlePageDelete}
      onPageReorder={handlePageReorder}
      onTotalPagesChange={setTotalPages}
      onJumpToPage={handleJumpToPage}
    />
  )

  return (
    <div className="flex flex-col flex-1 min-h-0 h-[calc(100vh-57px)] p-4">
      <BinderSpreadView
        spreads={spreads}
        spreadIndex={spreadIndex}
        onSpreadChange={setSpreadIndex}
        coverColor={binderCoverColor}
        binderName={binderName}
        description={binderDescription}
        slots={slots}
        totalPages={totalPages}
        gridType={gridType}
        onJumpToSlot={handleJumpToSlot}
        onAddPage={handleAddPage}
        settingsSlot={settingsDrawer}
        pageManagerSlot={pageManagerDialog}
        refreshSlot={refreshButton}
        {...sharedHandlers}
      />
      <BinderMobileView
        mobilePages={mobilePages}
        pageIndex={mobilePageIndex}
        onPageChange={setMobilePageIndex}
        coverColor={binderCoverColor}
        binderName={binderName}
        description={binderDescription}
        slots={slots}
        totalPages={totalPages}
        gridType={gridType}
        onJumpToSlot={handleJumpToSlot}
        onAddPage={handleAddPage}
        settingsSlot={settingsDrawer}
        pageManagerSlot={pageManagerDialog}
        refreshSlot={refreshButton}
        {...sharedHandlers}
      />
      <SlotCardPickerDialog
        open={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onConfirm={handleConfirmAddCard}
      />
      <InsertSlotGroupDialog
        open={insertPrompt !== null}
        groupCount={insertPrompt?.groupCount ?? 0}
        onOpenChange={(open) => { if (!open) setInsertPrompt(null) }}
        onChoose={(groupMode) => {
          const target = insertPrompt
          setInsertPrompt(null)
          if (target) void runSlotShift(target.mode, target.at, groupMode)
        }}
      />
      <SlotLabelDialog
        open={labelTargetId !== null}
        onOpenChange={(open) => { if (!open) setLabelTargetId(null) }}
        slot={slots.find((s) => s.id === labelTargetId) ?? null}
        onSubmit={handleSaveLabel}
      />
      <CardDetailDrawer
        card={viewCard}
        open={viewCard !== null}
        onClose={() => setViewCard(null)}
        onAddToBinder={handleAddToBinderFromDrawer}
        currentBinderId={binder.id}
      />
    </div>
  )
}
