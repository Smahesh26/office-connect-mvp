-- CreateTable
CREATE TABLE "POSTerminal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "POSTerminal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POSSession" (
    "id" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "openedBy" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openingCash" DECIMAL(12,2) NOT NULL,
    "closingCash" DECIMAL(12,2),

    CONSTRAINT "POSSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POSOrder" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "customerId" TEXT,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "POSOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POSOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "POSOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "POSTerminal_organizationId_idx" ON "POSTerminal"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "POSTerminal_organizationId_name_key" ON "POSTerminal"("organizationId", "name");

-- CreateIndex
CREATE INDEX "POSSession_terminalId_idx" ON "POSSession"("terminalId");

-- CreateIndex
CREATE INDEX "POSSession_openedBy_idx" ON "POSSession"("openedBy");

-- CreateIndex
CREATE INDEX "POSOrder_organizationId_idx" ON "POSOrder"("organizationId");

-- CreateIndex
CREATE INDEX "POSOrder_sessionId_idx" ON "POSOrder"("sessionId");

-- CreateIndex
CREATE INDEX "POSOrder_customerId_idx" ON "POSOrder"("customerId");

-- CreateIndex
CREATE INDEX "POSOrder_createdAt_idx" ON "POSOrder"("createdAt");

-- CreateIndex
CREATE INDEX "POSOrderItem_orderId_idx" ON "POSOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "POSOrderItem_productId_idx" ON "POSOrderItem"("productId");

-- AddForeignKey
ALTER TABLE "POSTerminal" ADD CONSTRAINT "POSTerminal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSSession" ADD CONSTRAINT "POSSession_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "POSTerminal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSOrder" ADD CONSTRAINT "POSOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSOrder" ADD CONSTRAINT "POSOrder_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "POSSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSOrder" ADD CONSTRAINT "POSOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSOrderItem" ADD CONSTRAINT "POSOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "POSOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSOrderItem" ADD CONSTRAINT "POSOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
