/*
  NOTE: Prisma 無法表達 gin_trgm_ops 索引，`migrate dev` 會自動想 DROP INDEX "Card_name_trgm_idx"
  （來自 20260704005011_add_card_name_trgm 的 raw-SQL 索引，卡名 ILIKE 搜尋所需）。
  已手動從本 migration 移除該 DROP INDEX，勿還原。
*/
-- AlterTable
ALTER TABLE "BinderSlot" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "groupIndex" INTEGER;

-- CreateTable
CREATE TABLE "BinderSlotGroup" (
    "id" TEXT NOT NULL,
    "binderId" TEXT NOT NULL,
    "cols" INTEGER NOT NULL,
    "rows" INTEGER NOT NULL,
    "rotation" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BinderSlotGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BinderSlotGroup_binderId_idx" ON "BinderSlotGroup"("binderId");

-- CreateIndex
CREATE INDEX "BinderSlot_groupId_idx" ON "BinderSlot"("groupId");

-- AddForeignKey
ALTER TABLE "BinderSlotGroup" ADD CONSTRAINT "BinderSlotGroup_binderId_fkey" FOREIGN KEY ("binderId") REFERENCES "Binder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderSlot" ADD CONSTRAINT "BinderSlot_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "BinderSlotGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
