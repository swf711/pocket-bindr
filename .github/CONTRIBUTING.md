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
- ✅ E2E 測試（`pnpm test:e2e`）通過
- ✅ 相關文件已同步更新

**E2E 於同一 repo 的分支與 PR 上自動執行**（CI 起獨立 Postgres 容器 + 精選卡牌 seed 子集，
零外部依賴即可自舉）。**Fork PR 例外**：GitHub Actions 對 fork PR 預設不提供 repo secrets，
故 E2E job 只在 push `main` 與同 repo（非 fork）PR 上執行；fork 提交的 PR 只會跑 lint / 單元測試 /
build，**E2E 由維護者把該分支推到 origin 觸發本 job 補驗**，合併前務必確認已補驗通過。

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

本專案採 trunk-based：`main` 是唯一長期分支，所有變更都經短命分支 → PR → 合併回 `main`。

- 每個改動開一條短命分支（`feat/...`、`fix/...` 等），push 後開 PR。
- 一個 PR 聚焦一件事，附上清楚的變更說明與測試方式；PR 描述是公開可見的「為何這樣改」文件落點。
- 依 PR 模板填寫檢查清單。
- CI 會自動跑 lint / 單元測試 / build；請確保通過。
- **合併採 squash merge**：公開 `git log` 每個 feature 保留一個乾淨 commit（壓掉 WIP / typo 等中間 commit），
  維持歷史可讀。
- **注意：PR 一開起來 diff 即公開**（即使尚未合併）。開 PR 前請再次確認分支未夾帶任何密鑰 /
  `.env` 類檔案——參見 [SECURITY.md](./SECURITY.md) 與 `.gitignore`。

更深入的架構背景見 [ARCHITECTURE.md](../ARCHITECTURE.md)。
