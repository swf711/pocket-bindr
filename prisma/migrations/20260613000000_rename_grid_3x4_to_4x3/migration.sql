-- 卡冊規格 3x4 改為 4x3（每頁仍 12 格，僅顯示欄列互換）
-- RENAME VALUE 會自動更新所有既有 Binder.gridType 資料列，無須資料轉換
ALTER TYPE "GridType" RENAME VALUE 'grid_3x4' TO 'grid_4x3';
