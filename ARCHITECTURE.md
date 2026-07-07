# 架構概覽

本文件提供系統的高層結構，協助貢獻者快速理解資料模型與關鍵設計決策。

## 技術結構

- **Next.js App Router**：Server Component 優先；互動元件標記 `'use client'`。
- **資料層**：Prisma + PostgreSQL。Schema 定義於 [`prisma/schema.prisma`](./prisma/schema.prisma)。
- **認證**：NextAuth.js v5（JWT session）。Email/密碼 ＋ Google / Discord OAuth。
- **UI**：Tailwind CSS + shadcn/ui。UI 互動元素一律基於 shadcn primitives；需要客製時另建延伸元件組合 primitives，
  不修改 `src/components/ui/` 下的原生 shadcn 檔。

## 核心資料模型

| Entity | 說明 |
| --- | --- |
| `User` | 使用者。可同時擁有密碼登入與多個 OAuth `Account`。 |
| `Card` | 一張卡牌。**語言是卡牌身份的一部分**——英 / 日 / 繁中各為獨立 `Card` 紀錄。 |
| `CardSet` | 卡牌所屬的系列 / 補充包。 |
| `Binder` | 使用者的卡冊，有自訂格式（如 4×3）、封面色、可選的公開分享 token。 |
| `UserCard` | 使用者對某張卡的**標記**（擁有 / 想要），含數量。 |
| `BinderSlot` | 卡冊頁面上的單一**格位**，記錄該格的卡與狀態。 |

### 兩層收藏模型

標記（`UserCard`）與格位（`BinderSlot`）是兩層獨立資料：

- 卡牌必須先有 `UserCard` 才能放入格位。
- 同一張卡可同時被標記為 owned 與 wanted（各為獨立紀錄）。
- `UserCard.quantity` 永遠等於該狀態的格位總數；雙表更新一律包在 `$transaction` 內以保持一致。

### 卡牌正規化（canonical alias）

部分卡牌沒有獨立的官方印刷，而是另一語言卡牌的別名。這類卡以 `canonicalCardId` 指向其 canonical 卡：
搜尋與顯示沿用別名的名稱 / 圖片，但實際收藏（`UserCard` / `BinderSlot`）會 resolve 成 canonical 卡，
並以 `displayCardId` 保留原始的顯示身份。此 resolve 在 API 層完成，前端無需感知。

## 認證與安全設計

- **帳號連結採「不自動連結」策略**：社群登入若 email 撞既有帳號且未綁定，不自動合併，導回登入頁引導。
- **密碼規則集中管理**：硬性規則（最短長度）由 server 端強制，註冊 / 改密碼 / 重設密碼共用同一份規則。
- **忘記密碼**：採 HMAC-SHA256 stateless token（零 schema 變更）；single-use 靠密碼 hash 前綴保證，重設後舊 token 自然失效。
- **純 OAuth 使用者補填 email**：無 email 的社群登入使用者可於設定頁自助新增並驗證 email（同樣採 HMAC-SHA256 stateless token），驗證後即可設定密碼作為登入逃生口。
- **Rate limiting**：寫入端點與圖片代理皆經 Upstash Redis 限流（見 `src/lib/rate-limit.ts`）。

> 安全機制的強度建立在環境變數中的密鑰，而非演算法的隱蔽性——公開設計不削弱安全性。

## 受保護路由

- middleware 保護：`/binders`、`/binders/[id]`、`/settings`、`/collection`（未登入導向 `/login`）。
- `/cards`（搜尋）未登入可瀏覽；收藏動作觸發登入 modal，登入後自動續行原動作。
- `/b/[token]`（公開分享）為唯讀，不需登入。

## 命名規範

檔案 kebab-case・元件 PascalCase・函式/變數 camelCase・DB 欄位 camelCase。
