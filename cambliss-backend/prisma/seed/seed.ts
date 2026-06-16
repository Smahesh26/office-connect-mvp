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
    { name: "ECOMMERCE", description: "Multi-vendor ecommerce marketplace module" },
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

  // 4️⃣ Create demo marketplace organization with admin + seller users
  let demoOrganization = await prisma.organization.findFirst({
    where: { name: demoOrgName },
  });

  if (!demoOrganization) {
    demoOrganization = await prisma.organization.create({
      data: { name: demoOrgName },
    });
  }

  const [adminRole, employeeRole] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { name: RoleName.ADMIN } }),
    prisma.role.findUniqueOrThrow({ where: { name: RoleName.EMPLOYEE } }),
  ]);

  const demoPasswordHash = await bcrypt.hash(demoPassword, 10);

  const [demoAdminUser, demoSellerUser] = await Promise.all([
    ensureUser({
      email: demoAdminEmail,
      passwordHash: demoPasswordHash,
      firstName: "Marketplace",
      lastName: "Admin",
      organizationId: demoOrganization.id,
    }),
    ensureUser({
      email: demoSellerEmail,
      passwordHash: demoPasswordHash,
      firstName: "Marketplace",
      lastName: "Seller",
      organizationId: demoOrganization.id,
    }),
  ]);

  await Promise.all([
    prisma.organizationUser.upsert({
      where: {
        organizationId_userId: {
          organizationId: demoOrganization.id,
          userId: demoAdminUser.id,
        },
      },
      update: { roleId: adminRole.id },
      create: {
        organizationId: demoOrganization.id,
        userId: demoAdminUser.id,
        roleId: adminRole.id,
      },
    }),
    prisma.organizationUser.upsert({
      where: {
        organizationId_userId: {
          organizationId: demoOrganization.id,
          userId: demoSellerUser.id,
        },
      },
      update: { roleId: employeeRole.id },
      create: {
        organizationId: demoOrganization.id,
        userId: demoSellerUser.id,
        roleId: employeeRole.id,
      },
    }),
  ]);

  // Ensure active plan + subscription so non-admin seller can access guarded routes.
  const activePlan =
    (await prisma.plan.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    })) ??
    (await prisma.plan.create({
      data: {
        name: "Marketplace Starter",
        description: "Default seeded plan",
        features: ["ECOMMERCE", "INVENTORY", "CRM"],
        price: "99.00",
        currency: "USD",
        interval: "MONTHLY",
        userLimit: 25,
        storageLimit: 20,
        isActive: true,
      },
    }));

  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      organizationId: demoOrganization.id,
      status: {
        in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE],
      },
    },
    select: { id: true },
  });

  if (!activeSubscription) {
    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 30);

    await prisma.subscription.create({
      data: {
        organizationId: demoOrganization.id,
        planId: activePlan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: start,
        currentPeriodEnd: end,
      },
    });
  }

  const ecommerceModule = await prisma.module.findUnique({
    where: { name: "ECOMMERCE" },
    select: { id: true },
  });

  if (ecommerceModule) {
    await prisma.organizationModule.upsert({
      where: {
        organizationId_moduleId: {
          organizationId: demoOrganization.id,
          moduleId: ecommerceModule.id,
        },
      },
      update: { isEnabled: true },
      create: {
        organizationId: demoOrganization.id,
        moduleId: ecommerceModule.id,
        isEnabled: true,
      },
    });
  }

  // 5️⃣ Create demo stores and seller membership mapping
  const [adminStore, sellerStore] = await Promise.all([
    prisma.store.upsert({
      where: { domain: "demo-admin-store.cambliss.local" },
      update: {
        organizationId: demoOrganization.id,
        name: "Admin Central Store",
        isActive: true,
        ownerUserId: demoAdminUser.id,
      },
      create: {
        organizationId: demoOrganization.id,
        name: "Admin Central Store",
        domain: "demo-admin-store.cambliss.local",
        description: "Platform-admin owned store",
        isActive: true,
        ownerUserId: demoAdminUser.id,
      },
    }),
    prisma.store.upsert({
      where: { domain: "demo-seller-store.cambliss.local" },
      update: {
        organizationId: demoOrganization.id,
        name: "Seller Central Store",
        isActive: true,
        ownerUserId: demoSellerUser.id,
      },
      create: {
        organizationId: demoOrganization.id,
        name: "Seller Central Store",
        domain: "demo-seller-store.cambliss.local",
        description: "Independent seller store",
        isActive: true,
        ownerUserId: demoSellerUser.id,
      },
    }),
  ]);

  await Promise.all([
    prisma.storeMember.upsert({
      where: {
        storeId_userId: {
          storeId: adminStore.id,
          userId: demoAdminUser.id,
        },
      },
      update: {
        organizationId: demoOrganization.id,
        role: StoreMemberRole.OWNER,
        isActive: true,
      },
      create: {
        organizationId: demoOrganization.id,
        storeId: adminStore.id,
        userId: demoAdminUser.id,
        role: StoreMemberRole.OWNER,
        isActive: true,
      },
    }),
    prisma.storeMember.upsert({
      where: {
        storeId_userId: {
          storeId: sellerStore.id,
          userId: demoSellerUser.id,
        },
      },
      update: {
        organizationId: demoOrganization.id,
        role: StoreMemberRole.OWNER,
        isActive: true,
      },
      create: {
        organizationId: demoOrganization.id,
        storeId: sellerStore.id,
        userId: demoSellerUser.id,
        role: StoreMemberRole.OWNER,
        isActive: true,
      },
    }),
  ]);

  // 6️⃣ Create products and list them across both stores
  const [productOne, productTwo] = await Promise.all([
    prisma.product.upsert({
      where: {
        organizationId_sku: {
          organizationId: demoOrganization.id,
          sku: "MKP-ADMIN-001",
        },
      },
      update: {
        name: "Admin Wireless Keyboard",
        unitPrice: "1299.00",
        isActive: true,
      },
      create: {
        organizationId: demoOrganization.id,
        name: "Admin Wireless Keyboard",
        sku: "MKP-ADMIN-001",
        unitPrice: "1299.00",
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: {
        organizationId_sku: {
          organizationId: demoOrganization.id,
          sku: "MKP-SELLER-001",
        },
      },
      update: {
        name: "Seller Noise-Cancel Headphones",
        unitPrice: "2599.00",
        isActive: true,
      },
      create: {
        organizationId: demoOrganization.id,
        name: "Seller Noise-Cancel Headphones",
        sku: "MKP-SELLER-001",
        unitPrice: "2599.00",
        isActive: true,
      },
    }),
  ]);

  await Promise.all([
    prisma.productListing.upsert({
      where: {
        storeId_productId: {
          storeId: adminStore.id,
          productId: productOne.id,
        },
      },
      update: {
        organizationId: demoOrganization.id,
        sellingPrice: "1399.00",
        isActive: true,
      },
      create: {
        organizationId: demoOrganization.id,
        storeId: adminStore.id,
        productId: productOne.id,
        sellingPrice: "1399.00",
        description: "Admin-owned flagship accessory",
        isActive: true,
        images: [],
      },
    }),
    prisma.productListing.upsert({
      where: {
        storeId_productId: {
          storeId: sellerStore.id,
          productId: productTwo.id,
        },
      },
      update: {
        organizationId: demoOrganization.id,
        sellingPrice: "2799.00",
        isActive: true,
      },
      create: {
        organizationId: demoOrganization.id,
        storeId: sellerStore.id,
        productId: productTwo.id,
        sellingPrice: "2799.00",
        description: "Seller-owned premium audio device",
        isActive: true,
        images: [],
      },
    }),
  ]);

  console.log("✅ Marketplace demo data seeded");
  console.log(`   Organization: ${demoOrgName}`);
  console.log(`   Admin login: ${demoAdminEmail} / ${demoPassword}`);
  console.log(`   Seller login: ${demoSellerEmail} / ${demoPassword}`);
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