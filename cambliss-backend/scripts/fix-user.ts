import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: { name: "Default Organization" }
    });
  }

  const userEmail = "newuser@camblissstudio.com";
  await prisma.user.update({
    where: { email: userEmail },
    data: { organizationId: org.id }
  });
  console.log("Updated newuser to be linked to organization:", org.name);
}

main().catch(console.error).finally(() => {
  prisma.$disconnect();
  pool.end();
});
