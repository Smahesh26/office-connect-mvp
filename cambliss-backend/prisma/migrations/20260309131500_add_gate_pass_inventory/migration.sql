-- CreateTable
CREATE TABLE "GatePass" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "passNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "warehouseId" TEXT NOT NULL,
    "vehicleNumber" TEXT,
    "driverName" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "notes" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GatePass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatePassItem" (
    "id" TEXT NOT NULL,
    "gatePassId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "GatePassItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GatePass_organizationId_passNumber_key" ON "GatePass"("organizationId", "passNumber");

-- CreateIndex
CREATE INDEX "GatePass_organizationId_idx" ON "GatePass"("organizationId");

-- CreateIndex
CREATE INDEX "GatePass_warehouseId_idx" ON "GatePass"("warehouseId");

-- CreateIndex
CREATE INDEX "GatePass_status_idx" ON "GatePass"("status");

-- CreateIndex
CREATE INDEX "GatePassItem_gatePassId_idx" ON "GatePassItem"("gatePassId");

-- CreateIndex
CREATE INDEX "GatePassItem_productId_idx" ON "GatePassItem"("productId");

-- AddForeignKey
ALTER TABLE "GatePass" ADD CONSTRAINT "GatePass_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatePassItem" ADD CONSTRAINT "GatePassItem_gatePassId_fkey" FOREIGN KEY ("gatePassId") REFERENCES "GatePass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatePassItem" ADD CONSTRAINT "GatePassItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
