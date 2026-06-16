-- AlterTable
ALTER TABLE "ReturnRequest" ADD COLUMN     "gatewayRefundId" TEXT,
ADD COLUMN     "gatewayRefundStatus" TEXT,
ADD COLUMN     "inspectedAt" TIMESTAMP(3),
ADD COLUMN     "inspectionNotes" TEXT,
ADD COLUMN     "inspectionOutcome" TEXT,
ADD COLUMN     "refundAmount" DECIMAL(14,2),
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT;
