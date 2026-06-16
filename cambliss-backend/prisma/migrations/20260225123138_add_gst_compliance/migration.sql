/*
  Warnings:

  - You are about to drop the column `taxAmount` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `taxAmount` on the `InvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `taxRate` on the `InvoiceItem` table. All the data in the column will be lost.
  - Added the required column `gstRate` to the `InvoiceItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "state" TEXT,
ADD COLUMN     "stateCode" TEXT;

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "taxAmount",
ADD COLUMN     "cgstAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "igstAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "placeOfSupply" TEXT,
ADD COLUMN     "sgstAmount" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "InvoiceItem" DROP COLUMN "taxAmount",
DROP COLUMN "taxRate",
ADD COLUMN     "cgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "cgstRate" DECIMAL(5,2),
ADD COLUMN     "gstRate" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "igstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "igstRate" DECIMAL(5,2),
ADD COLUMN     "sgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "sgstRate" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "PurchaseItem" ADD COLUMN     "cgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "gstRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "igstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "sgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "GSTConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "gstNumber" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "stateCode" TEXT NOT NULL,
    "isComposition" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GSTConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GSTConfig_organizationId_key" ON "GSTConfig"("organizationId");

-- CreateIndex
CREATE INDEX "GSTConfig_organizationId_idx" ON "GSTConfig"("organizationId");

-- AddForeignKey
ALTER TABLE "GSTConfig" ADD CONSTRAINT "GSTConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
