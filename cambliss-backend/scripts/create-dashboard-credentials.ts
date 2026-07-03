import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, RoleName, SubscriptionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Pool } from "pg";

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not defined`);
  }
  return value;
};

const connectionString = getRequiredEnv("DATABASE_URL");
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const getOptionalEnv = (name: string): string | null => {
  const value = process.env[name]?.trim();
  return value ? value : null;
};

const generateStrongPassword = (): string => {
  const token = crypto.randomBytes(18).toString("base64url");
  return `Oc_${token}_9!`;
};

const assertSafeCredentialInput = (email: string, password: string) => {
  if (email.endsWith(".local")) {
    throw new Error("Refusing to create a production-style test user with a .local email address");
  }

  if (password === "Pass@123") {
    throw new Error("Refusing to use weak default password Pass@123");
  }

  if (password.length < 12) {
    throw new Error("Password must be at least 12 characters");
  }
};

const ORG_NAME = getOptionalEnv("TEST_ORG_NAME") || "Cambliss Global Dashboard";
const ADMIN_EMAIL = getOptionalEnv("TEST_ADMIN_EMAIL");
const CLIENT_EMAIL = getOptionalEnv("TEST_CLIENT_EMAIL");
const ADMIN_PASSWORD = getOptionalEnv("TEST_ADMIN_PASSWORD") || generateStrongPassword();
const CLIENT_PASSWORD = getOptionalEnv("TEST_CLIENT_PASSWORD") || generateStrongPassword();

const ensureRole = async (name: RoleName) => {
  const existing = await prisma.role.findUnique({ where: { name } });
  if (existing) {
    return existing;
  }

  return prisma.role.create({ data: { name } });
};

const ensureUser = async (params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId: string;
}) => {
  const passwordHash = await bcrypt.hash(params.password, 10);

  const existing = await prisma.user.findUnique({ where: { email: params.email } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        firstName: params.firstName,
        lastName: params.lastName,
        passwordHash,
        organizationId: params.organizationId,
        isPlatformUser: false,
      },
    });
  }

  return prisma.user.create({
    data: {
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      passwordHash,
      organizationId: params.organizationId,
      isPlatformUser: false,
    },
  });
};

async function main() {
  if (!ADMIN_EMAIL && !CLIENT_EMAIL) {
    throw new Error("Provide TEST_ADMIN_EMAIL and/or TEST_CLIENT_EMAIL before running this script");
  }

  const organization =
    (await prisma.organization.findFirst({ where: { name: ORG_NAME } })) ??
    (await prisma.organization.create({ data: { name: ORG_NAME } }));

  const [adminRole, clientRole] = await Promise.all([
    ensureRole(RoleName.ADMIN),
    ensureRole(RoleName.CLIENT),
  ]);

  const adminUserPromise = ADMIN_EMAIL
    ? (() => {
        assertSafeCredentialInput(ADMIN_EMAIL, ADMIN_PASSWORD);
        return ensureUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          firstName: "Global",
          lastName: "Admin",
          organizationId: organization.id,
        });
      })()
    : Promise.resolve(null);

  const clientUserPromise = CLIENT_EMAIL
    ? (() => {
        assertSafeCredentialInput(CLIENT_EMAIL, CLIENT_PASSWORD);
        return ensureUser({
          email: CLIENT_EMAIL,
          password: CLIENT_PASSWORD,
          firstName: "Global",
          lastName: "Client",
          organizationId: organization.id,
        });
      })()
    : Promise.resolve(null);

  const [adminUser, clientUser] = await Promise.all([adminUserPromise, clientUserPromise]);

  await Promise.all([
    adminUser
      ? prisma.organizationUser.upsert({
          where: {
            organizationId_userId: {
              organizationId: organization.id,
              userId: adminUser.id,
            },
          },
          update: { roleId: adminRole.id },
          create: {
            organizationId: organization.id,
            userId: adminUser.id,
            roleId: adminRole.id,
          },
        })
      : Promise.resolve(null),
    clientUser
      ? prisma.organizationUser.upsert({
          where: {
            organizationId_userId: {
              organizationId: organization.id,
              userId: clientUser.id,
            },
          },
          update: { roleId: clientRole.id },
          create: {
            organizationId: organization.id,
            userId: clientUser.id,
            roleId: clientRole.id,
          },
        })
      : Promise.resolve(null),
  ]);

  const activePlan =
    (await prisma.plan.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    })) ??
    (await prisma.plan.create({
      data: {
        name: "Global Dashboard Starter",
        description: "Default plan for dashboard demo users",
        features: ["CRM", "INVENTORY"],
        price: "99.00",
        currency: "USD",
        interval: "MONTHLY",
        userLimit: 25,
        storageLimit: 20,
        isActive: true,
      },
    }));

  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      organizationId: organization.id,
      status: {
        in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE],
      },
    },
    select: { id: true },
  });

  if (!existingSubscription) {
    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 30);

    await prisma.subscription.create({
      data: {
        organizationId: organization.id,
        planId: activePlan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: start,
        currentPeriodEnd: end,
      },
    });
  }

  console.log("Global dashboard users are ready:");
  if (ADMIN_EMAIL) {
    console.log(`Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  }
  if (CLIENT_EMAIL) {
    console.log(`Client: ${CLIENT_EMAIL} / ${CLIENT_PASSWORD}`);
  }
}

main()
  .catch((error) => {
    console.error("Failed to create dashboard users:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
