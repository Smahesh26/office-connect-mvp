/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,userId]` on the table `OrganizationUser` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "OrganizationUser_organizationId_userId_roleId_key";

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "storageLimit" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "userLimit" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPlatformUser" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "organizationId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationUser_organizationId_userId_key" ON "OrganizationUser"("organizationId", "userId");
