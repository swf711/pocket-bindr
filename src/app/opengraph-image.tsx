import { ImageResponse } from 'next/og'
import { OG_SIZE, OG_CONTENT_TYPE, OG_DARK_BG, OG_CACHE_LONG, fetchImageDataUri } from '@/lib/og'
import { ogFonts } from '@/lib/og-fonts'
import { ogMessage } from '@/lib/og-messages'
import { logoDataUri, LOGO_ASPECT } from '@/lib/og-logo'
import { getShowcaseCards } from '@/lib/homepage-queries'

export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'PocketBindr'
// D4 移除 getTranslations() 後本路由不再有 dynamic API 依賴，Next 會將其判為可 SSG 的 static route——
// 但 getShowcaseCards 讀 DB、資料會隨爬蟲 backfill 變動而部署不會，靜態化等於凍結在 build 當下的展示卡。
// 明確 force-dynamic 維持「每次請求即時 render、靠 Cache-Control 控快取」的既有語意（D5 鎖定：不做靜態 PNG）。
export const dynamic = 'force-dynamic'

const LOGO_HEIGHT = 96
const CARD_W = 116
const CARD_H = Math.round((CARD_W * 7) / 5)
const CARD_GAP = 10
const BOX_PAD = 16
const BOX_BORDER = 3
// 3 欄固定寬度：需含 padding + border（Satori border-box）+ 少量 slack，確保剛好排 3×3 不換行
const BOX_W = CARD_W * 3 + CARD_GAP * 2 + BOX_PAD * 2 + BOX_BORDER * 2 + 6

export default async function OgImage() {
  const tagline = ogMessage('home.tagline')
  const fonts = ogFonts()
  const hasFont = fonts.length > 0

  // 取首頁 hero 同款展示卡（PTCG 繁中 + OPCG 日文交錯），預抓成 data URI 濾掉失敗者
  const [ptcg, opcg] = await Promise.all([
    getShowcaseCards('PTCG', 'ZH_TW', 5),
    getShowcaseCards('OPCG', 'JA', 4),
  ])
  const interleaved = ptcg.flatMap((c, i) => (opcg[i] ? [c, opcg[i]] : [c]))
  const dataUris = await Promise.all(interleaved.map((c) => fetchImageDataUri(c.imageSmall)))
  const cardImages = dataUris.filter((u): u is string => Boolean(u)).slice(0, 9)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          background: OG_DARK_BG,
          padding: '0 80px',
          gap: 48,
        }}
      >
        {/* 左：logo + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoDataUri('full')}
            width={Math.round(LOGO_HEIGHT * LOGO_ASPECT)}
            height={LOGO_HEIGHT}
            alt="PocketBindr"
          />
          {hasFont && (
            <div
              style={{
                fontFamily: 'Noto Sans JP',
                fontSize: 34,
                fontWeight: 400,
                color: '#aeb8c4',
                lineHeight: 1.45,
                maxWidth: 460,
              }}
            >
              {tagline}
            </div>
          )}
        </div>

        {/* 右：卡冊格位（暗色面板 + 3×3 卡圖，2D 微傾模擬立體） */}
        <div
          style={{
            display: 'flex',
            transform: 'rotate(4deg)',
            filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.55))',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              width: BOX_W,
              gap: CARD_GAP,
              padding: BOX_PAD,
              background: '#1c2028',
              border: `${BOX_BORDER}px solid #333a44`,
              borderRadius: 18,
            }}
          >
            {cardImages.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                width={CARD_W}
                height={CARD_H}
                alt=""
                style={{ objectFit: 'cover', borderRadius: 6 }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts, headers: { 'Cache-Control': OG_CACHE_LONG } },
  )
}
