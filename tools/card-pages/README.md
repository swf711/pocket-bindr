# pocketbindr-card-pages

卡片獨立頁的靜態產生器：把 78k+ 張卡的 SEO 落地頁預先渲染成純 HTML（不 hydrate），上傳到
Cloudflare R2，經自訂網域 `cards.pocketbindr.app` 直出。爬蟲流量完全不碰 Vercel。

**為何存在**：卡片頁在 Vercel 上每次渲染（含冷啟動）成本不低，全站被爬一次的 Active CPU
接近 Hobby 方案整月額度。改成 CDN 直出純靜態檔後，這條路徑對 Vercel 的成本歸零，
才有可能長期維持在 Hobby 方案並同時保留卡片頁的 SEO 索引。

刻意不放在 `scripts/` 目錄下——`.gitignore` 的 `scripts/` 規則在任何層級都會生效，
放進去會讓整個產生器不進版控。

## 架構

```
tools/card-pages/
  generate.ts   CLI 入口：查詢 DB → 逐卡渲染 → 與 R2 現況比對 → （--apply 才）上傳/刪除
  render.ts     renderCardPage()：純字串模板產出一頁 HTML
  css.ts        extractThemeTokens()：從 src/app/globals.css 抽色彩 token
  sync.ts       objectKeyFor() / planSync() / assertSafeRemoval()
  seo.ts        robots.txt / sitemap 產出，cardPageUrl()（對外網址單一來源）
  indexnow.ts   IndexNow 推送（fail-open，失敗不影響同步）
  r2.ts         R2（S3 相容 API）client 封裝
  messages.ts   三語文案（use-intl/core，不經 next-intl 的 React provider）
```

## 批次策略（避免 78k 張卡逐張查詢）

- 「同系列其他卡」：先對每個系列（現況約 900+ 個）各跑一次 `ORDER BY CARD_NUMBER_ORDER_SQL
  LIMIT 7` 的小查詢，取得該系列前 7 張的 id；再一次 `findMany` 撈全部卡片主體資料。
  每張卡的「同系列其他卡」= 該系列的 top-7 排除自己，取前 6 張——長尾卡（不在 top-7 內）
  會拿到與該系列其他長尾卡相同的 6 張連結，這是刻意的簡化，換取零 N+1 查詢。
- 排序刻意用 SQL（`ORDER BY`）而非撈回 JS 後 `Array.sort`：JS 字串排序與 Postgres collation
  可能不一致，兩處排序結果不一致會讓「同系列其他卡」與卡冊/搜尋頁看到的順序對不上。

## 對外網址與 R2 key 是兩種形式

- **R2 物件 key**（`objectKeyFor`）刻意用**解碼後**的 externalId——Cloudflare 會先解碼請求路徑再對 key。
- **對外網址**（sitemap、IndexNow、canonical）一律經 `cardPageUrl` → `cardPublicPath`，externalId 已編碼。
  不可拿 R2 key 直接拼網址：含 `?` 的 externalId 會被當成 query 起點。

## IndexNow

- 設定 GitHub secret `INDEXNOW_KEY`（8–128 個英數字或 `-`）後啟用；未設時完全略過。
- 產生器會把 `{key}.txt`（內容＝key）一併同步到子網域根目錄，作為協定要求的所有權驗證檔。
- 推送範圍：`--indexnow=changed`（預設，只推本次新增或內容變動的卡片頁）、`--indexnow=all`
  （全量回填，首次啟用時手動觸發一次）、`--indexnow=off`。只在 `--apply` 上傳完成後推送；
  dry-run 只印出將推送的筆數。
- 推送失敗只記 warning，不讓 workflow 失敗。IndexNow 由 Bing／Yandex 採用，Google 不支援。

## 首次設定

1. Cloudflare Dashboard 建立 R2 bucket（例如 `pocketbindr-card-pages`）。
2. 綁定自訂網域 `cards.pocketbindr.app` 到該 bucket（R2 → bucket → Settings → Custom Domains）。
3. 建立一組僅限該 bucket 讀寫的 R2 API token（Account API Token，Object Read & Write，
   限定該 bucket），取得 Account ID / Access Key ID / Secret Access Key。
4. 於 GitHub repo secrets 設定：`R2_ACCOUNT_ID`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、
   `R2_BUCKET`。

## 本機 dry-run

```bash
NEXT_PUBLIC_CARD_PAGES_ORIGIN="https://cards.pocketbindr.app" \
NEXT_PUBLIC_IMAGE_PROXY_ORIGIN="..." \
NEXT_PUBLIC_IMAGE_PROXY_WORKER_HOSTS="..." \
npx tsx tools/card-pages/generate.ts
```

- `DATABASE_URL`/`DIRECT_URL` 沿用專案既有 `.env`（`import 'dotenv/config'` 只讀取，
  不覆蓋已存在的 `process.env`；連 PROD 一律用「指令前綴環境變數覆蓋」，見 CLAUDE.md）。
- 未設定 `R2_ACCOUNT_ID` 等四個 R2 env 時，CLI 會自動退回「本機預覽模式」：印出總物件數、
  抽樣寫入 8 個頁面的 HTML 到 `tools/card-pages/.preview/`（已 gitignore）供人工檢視，
  不會嘗試連線 R2。
- 加 `--apply` 才會真的寫入 R2（需要完整 R2 憑證，否則直接 throw）。

## 驗證方式

- 本機 dry-run 後開啟 `tools/card-pages/.preview/*.html`，重點檢查：
  - externalId 含特殊字元的卡（如 `ex10-!`）：canonical / 連結 / R2 key 是否一致。
  - OPCG ZH_TW alias 卡：圖片是否正確 fallback 到 canonical（JA）來源。
  - 複數卡（合成圖，如 LEGEND／V-UNION）：同系列格線圖片是否用 `object-fit: contain`。
- 首次 apply 後：
  - `curl -sI https://cards.pocketbindr.app/ptcg/en/{某張卡}` 應回 200、`content-type: text/html`。
  - `curl https://cards.pocketbindr.app/robots.txt` 應能看到 `Sitemap:` 指向
    `https://cards.pocketbindr.app/sitemap.xml`。
  - `curl https://cards.pocketbindr.app/sitemap.xml` 應為 sitemapindex，逐一打開子檔確認
    URL 數量與總卡數吻合。

## 已知限制

- 新卡從寫入 DB 到下一次產生之前（排程為每日一次，另可手動觸發）之間，該卡的分享連結/
  舊網址 301 都會落到 R2 的 404（R2 自訂網域沒有 404 兜底頁）。資料維護後可手動觸發
  GitHub Actions workflow（`workflow_dispatch`）補產生。
- OG 圖仍由 Vercel 的 `next/og` Satori 產生（`og:image` 指向主站的 OG route），
  未搬到靜態產生器範圍內。
- OPCG 卡圖仍走 Vercel `/api/proxy-image`（CORP 限制，見 `src/lib/get-card-image-url.ts`）。
