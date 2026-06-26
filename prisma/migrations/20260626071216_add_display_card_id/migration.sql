-- AlterTable
ALTER TABLE "BinderSlot" ADD COLUMN     "displayCardId" TEXT;

-- AlterTable
ALTER TABLE "UserCard" ADD COLUMN     "displayCardId" TEXT;

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_displayCardId_fkey" FOREIGN KEY ("displayCardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderSlot" ADD CONSTRAINT "BinderSlot_displayCardId_fkey" FOREIGN KEY ("displayCardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;
