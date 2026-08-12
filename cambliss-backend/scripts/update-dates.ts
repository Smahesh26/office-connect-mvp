import 'dotenv/config';
import prisma from '../src/config/prisma';

async function main() {
  const now = new Date();
  
  const userResult = await prisma.user.updateMany({
    data: { createdAt: now }
  });
  console.log(`Updated ${userResult.count} users.`);

  const orgResult = await prisma.organization.updateMany({
    data: { createdAt: now }
  });
  console.log(`Updated ${orgResult.count} organizations.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
