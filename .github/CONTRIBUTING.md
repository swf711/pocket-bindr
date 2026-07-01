# 貢獻指南

感謝你對 PocketBindr 的貢獻。請在開始前閱讀本文件。

## 開發環境

依 [README 的「快速開始」](../README.md#快速開始) 完成本機環境設定。

## 開發流程

本專案採行為驅動的開發節奏：

> Behavior（釐清行為）→ Spec（型別 / API contract）→ Test（先寫測試）→ Implement → Refactor

每項變更在合併前須符合（與 CI 一致，為合併閘）：

- ✅ 單元測試（`pnpm test`）通過
- ✅ 編譯無誤（`pnpm build`）與 lint 乾淨（`pnpm lint`）
- ✅ 相關文件已同步更新

E2E 測試（`pnpm test:e2e`）需真實資料庫與 production build，成本較高，**不納入公開 CI**；
請於本機自行驗證，特別是涉及卡冊 / 收藏流程的變更。

## 分支與 Commit

- 分支命名：`feat/...`、`fix/...`、`docs/...`、`refactor/...`、`test/...`、`chore/...`
- Commit 訊息採 [Conventional Commits](https://www.conventionalcommits.org/)，描述可使用繁體中文：

  ```
  feat: 新增卡冊封面色選擇器
  fix: 修正格位數量與標記數量不同步
  ```

- 程式碼中的變數名稱與註解使用英文。

## 程式碼慣例

- Server Component 優先；Client Component 必須標記 `'use client'`。
- UI 互動元素一律基於 shadcn/ui；不修改 `src/components/ui/` 下的原生 shadcn 檔，需要客製時另建延伸元件。
- 需要身分的 API route：未登入回 401、非本人資源回 403。
- 涉及 schema 變更前，先確認 migration history 與資料庫無 drift，使用正式 migration（勿用 `db push` 跳過）。
- 任何會寫入 / 刪除資料的批次腳本，先以 dry-run 跑過再套用。

## Pull Request

- 一個 PR 聚焦一件事，附上清楚的變更說明與測試方式。
- 依 PR 模板填寫檢查清單。
- CI 會自動跑 lint / 單元測試 / build；請確保通過。

更深入的架構背景見 [ARCHITECTURE.md](../ARCHITECTURE.md)。
