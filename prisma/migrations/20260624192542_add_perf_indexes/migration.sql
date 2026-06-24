-- CreateIndex
CREATE INDEX "Binder_userId_idx" ON "Binder"("userId");

-- CreateIndex
CREATE INDEX "Card_setId_cardNumber_idx" ON "Card"("setId", "cardNumber");

-- CreateIndex
CREATE INDEX "Card_canonicalCardId_idx" ON "Card"("canonicalCardId");
