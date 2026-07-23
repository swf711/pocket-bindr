/*
  Warnings:

  - You are about to drop the column `provider` on the `User` table. All the data in the column will be lost.

  NOTE: Prisma 無法表達 gin_trgm_ops 索引，`migrate dev` 會自動想 DROP INDEX "Card_name_trgm_idx"
  （來自 20260704005011_add_card_name_trgm 的 raw-SQL 索引，卡名 ILIKE 搜尋所需）。
  已手動從本 migration 移除該 DROP INDEX，勿還原。
*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "provider";
