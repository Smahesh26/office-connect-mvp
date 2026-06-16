-- CreateTable
CREATE TABLE "EWayBill" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "transporterName" TEXT,
    "transporterGSTIN" TEXT,
    "vehicleNumber" TEXT,
    "transportMode" TEXT,
    "distance" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EWayBill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EWayBill_organizationId_idx" ON "EWayBill"("organizationId");

-- CreateIndex
CREATE INDEX "EWayBill_invoiceId_idx" ON "EWayBill"("invoiceId");

-- CreateIndex
CREATE INDEX "EWayBill_status_idx" ON "EWayBill"("status");

-- AddForeignKey
ALTER TABLE "EWayBill" ADD CONSTRAINT "EWayBill_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
