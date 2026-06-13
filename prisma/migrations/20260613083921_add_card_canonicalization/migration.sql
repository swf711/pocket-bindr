-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "canonicalCardId" TEXT,
ADD COLUMN     "isCollectible" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_canonicalCardId_fkey" FOREIGN KEY ("canonicalCardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;
