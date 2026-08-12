const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require('dotenv').config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const users = await prisma.user.findMany();
  let user = users[0];
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "ADMIN"
      }
    });
  }

  const orgs = await prisma.organization.findMany();
  let org = orgs[0];
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "Test Org",
        creatorId: user.id
      }
    });
  }

  const employees = await prisma.employee.findMany();
  console.log("Found employees:", employees.length);
  if (employees.length === 0) {
    const newEmp = await prisma.employee.create({
      data: {
        employeeCode: "EMP-001",
        organizationId: org.id,
        status: "ACTIVE",
        employmentType: "FULL_TIME",
        workMode: "HYBRID",
        salary: 50000,
        joinDate: new Date()
      }
    });
    console.log("Created dummy employee:", newEmp);
  } else {
    console.log("Employees:", employees.map(e => e.employeeCode));
  }
}

main().catch(console.error).finally(() => process.exit(0));
