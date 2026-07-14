import { ImageResponse } from 'next/og'
import { OG_SIZE, OG_CONTENT_TYPE, OG_DARK_BG, OG_CACHE_SHORT, fetchImageDataUri } from '@/lib/og'
import { ogFonts } from '@/lib/og-fonts'
import { ogMessage } from '@/lib/og-messages'
import { logoDataUri, LOGO_ASPECT, LOGO_SM_ASPECT } from '@/lib/og-logo'
import { fetchPublicBinder } from '@/lib/public-binder'

export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'PocketBindr'

const MAX_FAN = 5
const BRAND_LOGO_HEIGHT = 56

/** 中性品牌 fallback（token 失效 / 卡冊不存在）——純 logo，不依賴字型。 */
function brandFallback() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: OG_DARK_BG,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoDataUri()} width={Math.round(120 * LOGO_ASPECT)} height={120} alt="PocketBindr" />
      </div>
    ),
    { ...size, headers: { 'Cache-Control': OG_CACHE_SHORT } },
  )
}

export default async function BinderOgImage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const binder = await fetchPublicBinder(token)
  if (!binder) return brandFallback()

  const owner = binder.user.username ?? ogMessage('binder.defaultOwnerName')
  const cardCount = binder.slots.length
  const meta = ogMessage('metadata.ogBinderCount', { count: cardCount })
  const rawImages = binder.slots
    .map((s) => s.card?.imageSmall)
    .filter((url): url is string => Boolean(url))
    .slice(0, MAX_FAN)
  const images = (await Promise.all(rawImages.map((u) => fetchImageDataUri(u)))).filter(
    (u): u is string => Boolean(u),
  )

  const fonts = ogFonts()
  const hasFont = fonts.length > 0

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: binder.coverColor,
          fontFamily: 'Noto Sans JP',
          padding: '56px 64px',
        }}
      >
        {/* 頂部品牌標記（sm 精簡 BI 標記，不依賴字型） */}
        <div style={{ display: 'flex', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.45))' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoDataUri('sm')}
            width={Math.round(BRAND_LOGO_HEIGHT * LOGO_SM_ASPECT)}
            height={BRAND_LOGO_HEIGHT}
            alt="PocketBindr"
          />
        </div>

        {/* 卡圖 fan */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          {images.map((url, i) => (
            <img
              key={i}
              src={url}
              width={196}
              height={274}
              style={{
                objectFit: 'cover',
                borderRadius: 12,
                boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                marginLeft: i === 0 ? 0 : -36,
                transform: `rotate(${(i - (images.length - 1) / 2) * 6}deg)`,
              }}
            />
          ))}
        </div>

        {/* 底部文字面板 */}
        {hasFont && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(0,0,0,0.55)',
              borderRadius: 20,
              padding: '24px 32px',
              color: '#ffffff',
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 1000,
              }}
            >
              {binder.name}
            </div>
            <div style={{ display: 'flex', marginTop: 8, fontSize: 30, fontWeight: 400, opacity: 0.9 }}>
              {owner} · {meta}
            </div>
          </div>
        )}
      </div>
    ),
    { ...size, fonts, headers: { 'Cache-Control': OG_CACHE_SHORT } },
  )
}
