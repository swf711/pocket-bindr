import { ImageResponse } from 'next/og'
import { OG_SIZE, OG_CONTENT_TYPE, OG_DARK_BG, loadOgFonts, fetchImageDataUri } from '@/lib/og'
import { logoDataUri, LOGO_ASPECT } from '@/lib/og-logo'
import { resolveCardDisplayImage } from '@/lib/resolve-card-image'
import { parseCardPathParams } from '@/lib/card-url'
import { getPublicCardByTriple } from '@/lib/public-card'

export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'PocketBindr'

const BRAND_LOGO_HEIGHT = 48

/** 中性品牌 fallback（路徑非法 / 卡片不存在 / 圖片與字型皆載入失敗）——純 logo，不依賴字型。 */
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
        <img src={logoDataUri()} width={Math.round(120 * LOGO_ASPECT)} height={120} alt="PocketBindr" />
      </div>
    ),
    { ...size },
  )
}

type PageParams = { game: string; language: string; externalId: string }

export default async function CardOgImage({ params }: { params: Promise<PageParams> }) {
  const { game, language, externalId } = await params
  const parsed = parseCardPathParams(game, language)
  if (!parsed) return brandFallback()

  const card = await getPublicCardByTriple(parsed.game, parsed.language, decodeURIComponent(externalId))
  if (!card) return brandFallback()

  const image = resolveCardDisplayImage(card)
  const cardImageDataUri = image.large ? await fetchImageDataUri(image.large) : null

  const meta = `${card.set.externalId} ${card.cardNumber}`
  const fonts = await loadOgFonts(`${card.name}${card.set.name}${meta}`)
  const hasFont = fonts.length > 0

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          background: OG_DARK_BG,
          fontFamily: 'Noto Sans JP',
          padding: '56px 64px',
        }}
      >
        {cardImageDataUri && (
          <img
            src={cardImageDataUri}
            width={340}
            height={475}
            alt=""
            style={{ objectFit: 'cover', borderRadius: 16, boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}
          />
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: cardImageDataUri ? 56 : 0,
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', marginBottom: 24, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.45))' }}>
            <img
              src={logoDataUri()}
              width={Math.round(BRAND_LOGO_HEIGHT * LOGO_ASPECT)}
              height={BRAND_LOGO_HEIGHT}
              alt="PocketBindr"
            />
          </div>

          {hasFont && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 640,
                }}
              >
                {card.name}
              </div>
              <div style={{ display: 'flex', marginTop: 12, fontSize: 28, fontWeight: 400, opacity: 0.85 }}>
                {card.set.name} · {meta}
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts },
  )
}
