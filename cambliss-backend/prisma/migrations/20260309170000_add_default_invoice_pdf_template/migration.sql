ALTER TABLE "Organization"
ADD COLUMN IF NOT EXISTS "defaultInvoicePdfTemplate" TEXT NOT NULL DEFAULT 'classic';
