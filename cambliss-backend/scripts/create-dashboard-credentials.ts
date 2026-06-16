import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, RoleName, SubscriptionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
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

const ORG_NAME = "Cambliss Global Dashboard";
const ADMIN_EMAIL = "global.admin@cambliss.local";
const CLIENT_EMAIL = "global.client@cambliss.local";
const ADMIN_PASSWORD = "Pass@123";
const CLIENT_PASSWORD = "Pass@123";

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
  const organization =
    (await prisma.organization.findFirst({ where: { name: ORG_NAME } })) ??
    (await prisma.organization.create({ data: { name: ORG_NAME } }));

  const [adminRole, clientRole] = await Promise.all([
    ensureRole(RoleName.ADMIN),
    ensureRole(RoleName.CLIENT),
  ]);

  const [adminUser, clientUser] = await Promise.all([
    ensureUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      firstName: "Global",
      lastName: "Admin",
      organizationId: organization.id,
    }),
    ensureUser({
      email: CLIENT_EMAIL,
      password: CLIENT_PASSWORD,
      firstName: "Global",
      lastName: "Client",
      organizationId: organization.id,
    }),
  ]);

  await Promise.all([
    prisma.organizationUser.upsert({
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
    }),
    prisma.organizationUser.upsert({
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
    }),
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
        features: ["CRM", "ECOMMERCE", "INVENTORY"],
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
  console.log(`Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`Client: ${CLIENT_EMAIL} / ${CLIENT_PASSWORD}`);
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
