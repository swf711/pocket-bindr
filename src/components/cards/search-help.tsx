'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CircleHelp, ArrowDown, ArrowDownLeft } from 'lucide-react'
import type { Game } from '@prisma/client'
import { InputGroupButton } from '@/components/ui/input-group'
import { ResponsivePopover } from '@/components/common/responsive-popover'
import { cn } from '@/lib/utils'

interface MarkerBox {
  left: number
  top: number
  width: number
  height: number
}

type CalloutAnchor = 'left' | 'right' | 'center'

interface LegendMarker {
  box: MarkerBox
  /** `cards.help.*` i18n key（不含 `help.` 前綴） */
  labelKey: string
  anchor: CalloutAnchor
}

interface GameLegendConfig {
  image: string
  imageWidth: number
  imageHeight: number
  markers: LegendMarker[]
  /**
   * 標註區固定 theme-scope：以 `light`/`dark` class 強制 token 解析到指定 scheme，
   * 讓標註配色不隨 UI theme 變（卡圖為 theme 不變素材）。OPCG=dark、PTCG=light。
   */
  themeClass: 'light' | 'dark'
  /** 標註顏色 Tailwind class（border/text 共用），須與該卡圖底色形成對比 */
  highlightClass: string
  /** 該遊戲卡面系列碼/卡號實際印刷位置（PTCG 左下角；OPCG 右下角），對應 i18n hint 文案 key */
  hintKey: 'legendHintBottomLeft' | 'legendHintBottomRight'
}

/**
 * 標註座標為對應 public/ 卡圖之百分比框（左上角 + 寬高），針對該圖手動測量。
 * 換圖需重新測量座標；PTCG／OPCG 卡面排版不同故分開設定。
 * 標註顏色依卡圖底色分開挑選（PTCG 綠底用紅、OPCG 紅底改用藍），避免顏色與卡面底色太接近而看不清楚；
 * 並以固定 theme-scope（PTCG=light、OPCG=dark）凍結整組配色（含標籤 pill 底），不隨 UI theme 漂移。
 * PTCG 卡面系列碼與卡號中間有空隙，分兩框各自標註（標籤錨定各自框的外側邊緣並往外展開避免重疊）；
 * OPCG 卡面系列碼卡號連在一起印成一串（如 `OP16-015`），改用單一框 + 單一「系列碼+卡號」合併標籤。
 */
const LEGEND_CONFIG: Record<Game, GameLegendConfig> = {
  PTCG: {
    image: '/search-legend-ptcg.png',
    imageWidth: 868,
    imageHeight: 1212,
    markers: [
      { box: { left: 8, top: 93.1, width: 8, height: 4 }, labelKey: 'setCodeLabel', anchor: 'left' },
      { box: { left: 15, top: 94, width: 13, height: 3.5 }, labelKey: 'cardNumberLabel', anchor: 'right' },
    ],
    themeClass: 'light',
    highlightClass: 'border-destructive text-destructive',
    hintKey: 'legendHintBottomLeft',
  },
  OPCG: {
    image: '/search-legend-opcg.png',
    imageWidth: 600,
    imageHeight: 838,
    markers: [
      { box: { left: 75, top: 93.5, width: 13.5, height: 3.5 }, labelKey: 'setCodeAndNumberLabel', anchor: 'center' },
    ],
    themeClass: 'dark',
    highlightClass: 'border-primary text-primary',
    hintKey: 'legendHintBottomRight',
  },
}

function toBoxStyle(box: MarkerBox): React.CSSProperties {
  return {
    left: `${box.left}%`,
    top: `${box.top}%`,
    width: `${box.width}%`,
    height: `${box.height}%`,
  }
}

/** 標籤位置依 anchor：left/right 錨定框的外側邊緣往兩側展開；center 置中在框正上方 */
function toCalloutStyle(box: MarkerBox, anchor: CalloutAnchor): React.CSSProperties {
  if (anchor === 'left') {
    return { left: `${box.left - 3}%`, top: `${Math.max(box.top - 9, 2)}%` }
  }
  if (anchor === 'center') {
    return {
      left: `${box.left + box.width / 2}%`,
      top: `${Math.max(box.top - 9, 2)}%`,
      transform: 'translateX(-50%)',
    }
  }
  return { left: `${box.left + box.width - 1}%`, top: `${Math.max(box.top - 6, 2)}%` }
}

interface SearchHelpProps {
  game: Game
}

function MarkerCallout({
  marker,
  label,
  highlightClass,
}: {
  marker: LegendMarker
  label: string
  highlightClass: string
}) {
  const { box, anchor } = marker
  const Arrow = anchor === 'right' ? ArrowDownLeft : ArrowDown
  return (
    <>
      <div className={cn('absolute rounded-sm border-4', highlightClass)} style={toBoxStyle(box)} />
      <div
        className={cn('absolute flex items-center', anchor === 'right' ? 'flex-row-reverse' : 'flex-col')}
        style={toCalloutStyle(box, anchor)}
      >
        <span
          className={cn(
            'rounded border bg-background px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap',
            highlightClass
          )}
        >
          {label}
        </span>
        <Arrow className={cn('size-5 shrink-0', anchor === 'right' ? 'mt-3' : '', highlightClass)} strokeWidth={3} />
      </div>
    </>
  )
}

export function SearchHelp({ game }: SearchHelpProps) {
  const t = useTranslations('cards')
  const [open, setOpen] = useState(false)
  const config = LEGEND_CONFIG[game]

  return (
    <ResponsivePopover
      open={open}
      onOpenChange={setOpen}
      title={t('help.title')}
      popoverClassName="w-96"
      align="end"
      trigger={
        <InputGroupButton
          type="button"
          size="icon-sm"
          data-testid="search-help-trigger"
          aria-label={t('help.triggerLabel')}
          title={t('help.triggerLabel')}
        >
          <CircleHelp />
        </InputGroupButton>
      }
    >
      <div className="flex flex-col gap-3" data-testid="search-help-content">
        <p className="text-sm font-medium">{t('help.title')}</p>
        {/* themeClass 固定 scheme：標註 token（highlightClass / 標籤 bg-background）一律解析到
            該 scheme，不隨 UI theme 變（見 GameLegendConfig.themeClass 註解） */}
        <div
          className={cn('relative w-full overflow-hidden rounded-md', config.themeClass)}
          style={{ aspectRatio: `${config.imageWidth} / ${config.imageHeight}` }}
        >
          {/* 刻意用原生 img（非 next/image）：曾觀察到 next/image optimizer 在 dev 換圖後
              serve 舊快取 bytes，此圖為固定本地素材，改走原生 img 直接繞開該層快取 */}
          <img
            src={config.image}
            alt={t('help.title')}
            className="absolute inset-0 size-full object-contain"
          />
          {config.markers.map((marker) => (
            <MarkerCallout
              key={marker.labelKey}
              marker={marker}
              label={t(`help.${marker.labelKey}`)}
              highlightClass={config.highlightClass}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t(`help.${config.hintKey}`)}</p>
      </div>
    </ResponsivePopover>
  )
}
