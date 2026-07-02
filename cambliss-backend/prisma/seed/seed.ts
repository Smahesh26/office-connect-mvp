import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, RoleName, StoreMemberRole, SubscriptionStatus } from "@prisma/client";
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

const superAdminEmail = getRequiredEnv("SUPER_ADMIN_EMAIL");
const superAdminPassword = getRequiredEnv("SUPER_ADMIN_PASSWORD");
const superAdminFirstName = process.env.SUPER_ADMIN_FIRST_NAME ?? "Super";
const superAdminLastName = process.env.SUPER_ADMIN_LAST_NAME ?? "Admin";

const demoOrgName = process.env.DEMO_ORG_NAME ?? "Cambliss Marketplace Demo";
const demoAdminEmail = process.env.DEMO_ADMIN_EMAIL ?? "admin.marketplace@cambliss.local";
const demoSellerEmail = process.env.DEMO_SELLER_EMAIL ?? "seller.marketplace@cambliss.local";
const demoPassword = process.env.DEMO_USER_PASSWORD ?? "Pass@123";

const ensureUser = async (params: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  organizationId: string;
}) => {
  const existing = await prisma.user.findUnique({
    where: { email: params.email },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        firstName: params.firstName,
        lastName: params.lastName,
        passwordHash: params.passwordHash,
        organizationId: params.organizationId,
      },
    });
  }

  return prisma.user.create({
    data: {
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      passwordHash: params.passwordHash,
      organizationId: params.organizationId,
    },
  });
};

async function main() {
  console.log("🌱 Seeding Cambliss database...");

  // 1️⃣ Create Roles
  for (const role of Object.values(RoleName)) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role },
    });
  }

  console.log("✅ Roles seeded");

  // 2️⃣ Create SUPER_ADMIN
  const existingAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        passwordHash: hashedPassword,
        firstName: superAdminFirstName,
        lastName: superAdminLastName,
        isPlatformUser: true,
        organizationId: null,
      },
    });

    // Platform user does NOT belong to organization
    // So we don't create OrganizationUser record

    console.log("✅ SUPER_ADMIN created:", superAdmin.email);
  } else {
    console.log("⚠ SUPER_ADMIN already exists");
  }

  // 3️⃣ Create Default Modules
  const defaultModules = [
    { name: "CRM", description: "Customer Relationship Management" },
    { name: "HRM", description: "Human Resource Management" },
    { name: "INVENTORY", description: "Inventory Management System" },
    { name: "ACCOUNTING", description: "Accounting & Finance Module" },
    { name: "PROJECTS", description: "Project Management Module" },
    { name: "FILES", description: "File Storage & Management" },
    { name: "D2C", description: "Direct-to-Customer Sales Module" },
    { name: "FOOD", description: "Food & Restaurant Management" },
    { name: "AUTOMATION", description: "Workflow Automation" },
    { name: "ANALYTICS", description: "Analytics & Reporting" },
  ];

  for (const modData of defaultModules) {
    await prisma.module.upsert({
      where: { name: modData.name },
      update: {},
      create: {
        name: modData.name,
        description: modData.description,
      },
    });
  }

  console.log("✅ Default modules seeded");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });