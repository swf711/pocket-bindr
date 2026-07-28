'use client'

import { SlotCard } from './slot-card'
import type { SlotWithCard } from '@/types/binder'

interface SlotDragOverlayProps {
  activeSlot: SlotWithCard
  /** 卡冊全部格位，用於取出同組成員 */
  allSlots: SlotWithCard[]
}

const noop = () => {}

/**
 * 拖曳中的幽靈影像。跨格群組要顯示**整組的實際佔用範圍**，而不是被抓住的那一格——
 * 否則使用者看不出自己在搬動 N 格，也無從預期會落在哪裡。
 *
 * dnd-kit 的 DragOverlay 尺寸＝被拖曳節點的尺寸（即一格），故群組要自行放大成
 * `cols × rows` 格並**往抓取點的反方向位移**，讓幽靈的相對位置與實際佔格對齊：
 * 抓住右下角那格拖曳時，幽靈應往左上延伸，而不是從游標往右下長出去。
 *
 * 格間刻意 **gap 0**：群組各格顯示的是同一張合成圖的相鄰區塊，貼合後正好還原成
 * 一張完整卡圖，是很直覺的「我在搬這一整張卡」提示。
 */
export function SlotDragOverlay({ activeSlot, allSlots }: SlotDragOverlayProps) {
  const span = activeSlot.span
  if (!span) {
    return <SlotCard slot={activeSlot} onDelete={noop} onToggleStatus={noop} isDragOverlay />
  }

  const members = allSlots
    .filter((s) => s.span?.groupId === span.groupId)
    .sort((a, b) => (a.span!.groupIndex ?? 0) - (b.span!.groupIndex ?? 0))

  // 成員資料不完整時退回單格，寧可少一點視覺提示也不要破版
  if (members.length !== span.cols * span.rows) {
    return <SlotCard slot={activeSlot} onDelete={noop} onToggleStatus={noop} isDragOverlay />
  }

  const grabbedRow = Math.floor(span.groupIndex / span.cols)
  const grabbedCol = span.groupIndex % span.cols

  return (
    // 🔴 根元素必須維持「一格」大小、不得放大或位移：dnd-kit 的碰撞偵測用 DragOverlay 的
    // rect，一旦把它撐成整組，拖曳中的 active rect 會與原本那組格位持續保持巨大交集，
    // 使用者得把游標整個拖到目標格中心才翻得過去（實測 20%～90% 全程黏在自己的格位）。
    // 故放大的幽靈改成溢出的絕對定位子層，只影響視覺、不影響量測。
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        style={{
          position: 'absolute',
          top: `-${grabbedRow * 100}%`,
          left: `-${grabbedCol * 100}%`,
          width: `${span.cols * 100}%`,
          height: `${span.rows * 100}%`,
          display: 'grid',
          gridTemplateColumns: `repeat(${span.cols}, 1fr)`,
        }}
      >
        {members.map((member) => (
          <SlotCard
            key={member.id}
            slot={member}
            onDelete={noop}
            onToggleStatus={noop}
            isDragOverlay
          />
        ))}
      </div>
    </div>
  )
}
