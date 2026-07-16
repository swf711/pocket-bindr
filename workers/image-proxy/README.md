# pocketbindr-image-proxy

外部卡圖 upstream 的 Cloudflare 暖存 proxy，與 Next.js 的 `/api/proxy-image` 並存分流（見下方「分流」）。

**為何存在**：卡圖來源不可下載自存（官方來源明文禁止複製/改変/配布，見 docs/DATA_SOURCES.md），故以
proxy 提供。本 Worker 純 passthrough + edge 暫時快取，法律姿態與 Next.js 端 proxy 零增量；差異在 egress
成本。

## 分流

由 `NEXT_PUBLIC_IMAGE_PROXY_WORKER_HOSTS`（app 端 env）控制哪些 upstream host 走本 Worker，未列入者
回退至 Next.js 的 `/api/proxy-image`。**不同 origin 對 edge proxy 的相容性不同，分流清單依實測結果調整。**

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

`src/lib/get-card-image-url.ts` 依兩個 env 分流（皆可逆）：`NEXT_PUBLIC_IMAGE_PROXY_ORIGIN`（本 Worker
base URL，未設 → 全部回退 `/api/proxy-image`）＋ `NEXT_PUBLIC_IMAGE_PROXY_WORKER_HOSTS`（走 Worker 的
host 白名單，未列入者回退 `/api/proxy-image`）。

## 已知限制

- CF Worker 免費額度 100k req/day；現況 ~22k/day，有緩衝但非無限（見計畫「已知風險」）。
- `namespace_id` 目前為佔位值 `"1001"`，首次部署需依 wrangler 提示確認/建立實際 rate limiting namespace。
