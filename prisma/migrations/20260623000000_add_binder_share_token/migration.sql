-- AlterTable
ALTER TABLE "Binder" ADD COLUMN "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Binder_shareToken_key" ON "Binder"("shareToken");
