import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, RoleName } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? "admin@camblissstudio.com";
const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD ?? "SecureAdminPassword123!";

const userEmail = "bhaskeradv1@gmail.com";
const userPassword = "Embpython@2020";

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

  // 2️⃣ Ensure Default Organization
  let defaultOrg = await prisma.organization.findFirst({
    where: { name: "Cambliss Enterprise Demo" },
  });

  if (!defaultOrg) {
    defaultOrg = await prisma.organization.create({
      data: {
        name: "Cambliss Enterprise Demo",
      },
    });
  }

  // 3️⃣ Create SUPER_ADMIN (admin@camblissstudio.com)
  const hashedAdminPassword = await bcrypt.hash(superAdminPassword, 10);
  const existingAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingAdmin) {
    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        passwordHash: hashedAdminPassword,
        firstName: "Super",
        lastName: "Admin",
        isPlatformUser: true,
        organizationId: defaultOrg.id,
      },
    });
    console.log("✅ SUPER_ADMIN created:", superAdmin.email);
  } else {
    await prisma.user.update({
      where: { email: superAdminEmail },
      data: { passwordHash: hashedAdminPassword, isPlatformUser: true },
    });
    console.log("✅ SUPER_ADMIN updated:", superAdminEmail);
  }

  // 4️⃣ Create Standard User (bhaskeradv1@gmail.com)
  const hashedUserPassword = await bcrypt.hash(userPassword, 10);
  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!existingUser) {
    const standardUser = await prisma.user.create({
      data: {
        email: userEmail,
        passwordHash: hashedUserPassword,
        firstName: "Bhasker",
        lastName: "User",
        isPlatformUser: false,
        organizationId: defaultOrg.id,
      },
    });
    console.log("✅ User created:", standardUser.email);
  } else {
    await prisma.user.update({
      where: { email: userEmail },
      data: { passwordHash: hashedUserPassword, organizationId: defaultOrg.id },
    });
    console.log("✅ User updated:", userEmail);
  }

  // 5️⃣ Create Default Modules
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