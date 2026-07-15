# pocketbindr-image-proxy

外部官網卡圖（PROXY_HOSTNAMES）的 Cloudflare 暖存 proxy，取代 Vercel `/api/proxy-image`。

**為何存在**：pokemon-card.com / onepiece-cardgame.com 官網明文禁止複製/改変/配布卡圖，故不可下載
自存到 R2/Supabase（見 CLAUDE.md 核心設計決策、docs/DATA_SOURCES.md）。本 Worker 純 passthrough +
CF edge 暫時快取，法律姿態與現行 Vercel proxy 零增量；差異只在 egress 免費、CF→官網走內網。

## 首次部署

```bash
cd workers/image-proxy
npx wrangler login   # 若尚未登入；需先在 CF dashboard 註冊 workers.dev 子網域（一次性）

# Rate limiting binding 的 namespace_id 需先建立（"1001" 為佔位值，換成 wrangler 產生的實際值）：
# 部署時若 namespace_id 不存在，wrangler 會提示自動建立或需手動於 dashboard 建立。

npx wrangler deploy
```

部署後於 CF DNS 確認 `images.pocketbindr.app` 的 Custom Domain 已建立（`wrangler deploy` 依
`wrangler.jsonc` 的 `routes[].custom_domain: true` 自動建立，需該 zone 已在同帳號）。

## 驗證

```bash
curl -sI "https://images.pocketbindr.app/?url=https://www.pokemon-card.com/assets/images/card_images/large/M2/048345_P_HASUBO.jpg"
# 預期：200, content-type: image/jpeg, cross-origin-resource-policy: cross-origin

curl -sI "https://images.pocketbindr.app/?url=https://evil.example.com/x.png"
# 預期：403（不在白名單）
```

## 對應 app 端

`src/lib/get-card-image-url.ts` 的 `NEXT_PUBLIC_IMAGE_PROXY_ORIGIN` 若設為
`https://images.pocketbindr.app`，全站卡圖會改指向本 Worker；未設則回退 `/api/proxy-image`（可逆）。

## 已知限制

- CF Worker 免費額度 100k req/day；現況 ~22k/day，有緩衝但非無限（見計畫「已知風險」）。
- `namespace_id` 目前為佔位值 `"1001"`，首次部署需依 wrangler 提示確認/建立實際 rate limiting namespace。
