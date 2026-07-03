import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not defined`);
  return value;
};

const pool = new Pool({ connectionString: getRequiredEnv("DATABASE_URL") });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserAccessProfile" (
      "userId" TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
      "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
      "phone" TEXT,
      "accesses" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      "createdBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "UserAccessProfile_org_idx"
    ON "UserAccessProfile"("organizationId")
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ChatMessage" (
      "id" TEXT PRIMARY KEY,
      "organizationId" TEXT NOT NULL,
      "senderUserId" TEXT NOT NULL,
      "senderEmail" TEXT NOT NULL,
      "senderName" TEXT,
      "senderRole" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ChatMessage_organizationId_createdAt_idx"
    ON "ChatMessage" ("organizationId", "createdAt")
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "OrganizationOnboarding" (
      "organizationId" TEXT PRIMARY KEY REFERENCES "Organization"("id") ON DELETE CASCADE,
      "profileCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
      "paymentCardOnboarded" BOOLEAN NOT NULL DEFAULT FALSE,
      "preferredCurrency" TEXT NOT NULL DEFAULT 'INR',
      "stackSelections" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "onboardingPayload" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Insert missing UserAccessProfile rows for existing users
  await prisma.$executeRawUnsafe(`
    INSERT INTO "UserAccessProfile" ("userId", "organizationId", "accesses", "createdAt", "updatedAt")
    SELECT u.id, u."organizationId", ARRAY[]::TEXT[], NOW(), NOW()
    FROM "User" u
    WHERE u."organizationId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "UserAccessProfile" uap WHERE uap."userId" = u.id
      )
  `);

  console.log("All raw tables created and existing users backfilled.");
}

main()
  .catch((error) => {
    console.error("Setup failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
