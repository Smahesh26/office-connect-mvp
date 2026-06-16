-- Add seller ownership and user-store membership for ecommerce store isolation

CREATE TYPE "StoreMemberRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF', 'VIEWER');

ALTER TABLE "Store"
ADD COLUMN "ownerUserId" TEXT;

CREATE TABLE "StoreMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "StoreMemberRole" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoreMember_storeId_userId_key" ON "StoreMember"("storeId", "userId");
CREATE INDEX "Store_ownerUserId_idx" ON "Store"("ownerUserId");
CREATE INDEX "StoreMember_organizationId_idx" ON "StoreMember"("organizationId");
CREATE INDEX "StoreMember_storeId_idx" ON "StoreMember"("storeId");
CREATE INDEX "StoreMember_userId_idx" ON "StoreMember"("userId");

ALTER TABLE "Store"
ADD CONSTRAINT "Store_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StoreMember"
ADD CONSTRAINT "StoreMember_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StoreMember"
ADD CONSTRAINT "StoreMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
