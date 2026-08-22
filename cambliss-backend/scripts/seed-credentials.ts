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

async function seedCredentials() {
  console.log("🌱 Seeding requested user & admin credentials into Database...");

  // 1. Ensure Roles Exist
  for (const role of Object.values(RoleName)) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role },
    });
  }

  // 2. Ensure Default Organization for User Context
  let defaultOrg = await prisma.organization.findFirst({
    where: { name: "Cambliss Enterprise Demo" },
  });

  if (!defaultOrg) {
    defaultOrg = await prisma.organization.create({
      data: {
        name: "Cambliss Enterprise Demo",
        slug: "cambliss-enterprise-demo",
      },
    });
    console.log("✅ Created default Organization: Cambliss Enterprise Demo");
  }

  // 🔑 CREDENTIAL 1: Admin Credentials
  const adminEmail = "admin@camblissstudio.com";
  const adminPassword = "SecureAdminPassword123!";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminPasswordHash,
        firstName: "Super",
        lastName: "Admin",
        isPlatformUser: true,
        organizationId: defaultOrg.id,
      },
    });
    console.log(`✅ Created Admin User: ${adminEmail}`);
  } else {
    adminUser = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        passwordHash: adminPasswordHash,
        isPlatformUser: true,
      },
    });
    console.log(`✅ Updated Admin Password & Status for: ${adminEmail}`);
  }

  // Assign ADMIN Role
  await prisma.organizationUser.upsert({
    where: {
      userId_organizationId: {
        userId: adminUser.id,
        organizationId: defaultOrg.id,
      },
    },
    update: { role: RoleName.ADMIN },
    create: {
      userId: adminUser.id,
      organizationId: defaultOrg.id,
      role: RoleName.ADMIN,
    },
  });

  // 🔑 CREDENTIAL 2: Standard / Merchant User Credentials
  const userEmail = "bhaskeradv1@gmail.com";
  const userPassword = "Embpython@2020";
  const userPasswordHash = await bcrypt.hash(userPassword, 10);

  let standardUser = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!standardUser) {
    standardUser = await prisma.user.create({
      data: {
        email: userEmail,
        passwordHash: userPasswordHash,
        firstName: "Bhasker",
        lastName: "User",
        isPlatformUser: false,
        organizationId: defaultOrg.id,
      },
    });
    console.log(`✅ Created Standard User: ${userEmail}`);
  } else {
    standardUser = await prisma.user.update({
      where: { email: userEmail },
      data: {
        passwordHash: userPasswordHash,
        organizationId: defaultOrg.id,
      },
    });
    console.log(`✅ Updated User Password for: ${userEmail}`);
  }

  // Assign MEMBER Role
  await prisma.organizationUser.upsert({
    where: {
      userId_organizationId: {
        userId: standardUser.id,
        organizationId: defaultOrg.id,
      },
    },
    update: { role: RoleName.MEMBER },
    create: {
      userId: standardUser.id,
      organizationId: defaultOrg.id,
      role: RoleName.MEMBER,
    },
  });

  console.log("\n🎉 Credentials Seeding Finished Successfully!");
  console.log("-----------------------------------------------");
  console.log(`1. Admin Account:    ${adminEmail} / ${adminPassword}`);
  console.log(`2. User Account:     ${userEmail} / ${userPassword}`);
  console.log("-----------------------------------------------\n");
}

seedCredentials()
  .catch((e) => {
    console.error("❌ Credential Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
